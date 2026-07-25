<script lang="ts">
  import { onMount } from 'svelte';
  import Hls from 'hls.js';
  import { playerState, bookTime, displayTime, locateTrack } from '$lib/stores/player';
  import { createClock } from '$lib/player/clock';
  import { streamUrl } from '$lib/player/audio-engine';
  import { setupMediaSession } from '$lib/player/media-session';
  import { initProgressSync } from '$lib/player/progress-sync';
  import { get } from 'svelte/store';
  import LyricsPane from '$lib/components/lyrics/LyricsPane.svelte';
  import SubtitleSettings from '$lib/components/subtitles/SubtitleSettings.svelte';
  import { parseSubtitleText } from '$lib/parse-subtitle';
  import type { SubtitleTrack, Cue } from '$lib/types';

  let { data } = $props();
  const tracks = $derived(data.session.audioTracks);
  const chapters = $derived(data.session.chapters);
  const duration = $derived(data.session.duration);

  let audio: HTMLAudioElement;
  let preloadAudio: HTMLAudioElement;
  let currentTrackOffset = $state(0);
  let clockCleanup: (() => void) | null = null;
  let error = $state('');
  let hls: Hls | null = null;

  const isHls = $derived(tracks[0]?.mimeType.includes('mpegurl') ?? false);

  onMount(() => {
    if (!tracks.length) {
      error = 'No audio tracks found for this book.';
      return;
    }

    playerState.set({
      itemId: data.item.id,
      sessionId: data.session.id,
      tracks,
      chapters,
      duration,
      playing: false,
      rate: 1,
      volume: Number(localStorage.getItem('syncspeak_volume') ?? 1),
      buffering: false
    });

    const initialTime = data.session.currentTime;
    const result = locateTrack(tracks, initialTime);
    if (!result || !result.track) {
      error = 'Could not locate starting track.';
      return;
    }
    const { track, localTime } = result;
    currentTrackOffset = track.startOffset;
    const url = streamUrl(data.item.id, track.ino);

    audio.volume = get(playerState).volume;

    audio.addEventListener('error', () => {
      const msg = audio?.error?.message ?? 'Unknown error';
      error = `Failed to load audio: ${msg}`;
    });

    if (track.mimeType.includes('mpegurl')) {
      setupHls(url, localTime, initialTime);
    } else {
      audio.src = url;
      audio.load();
      audio.addEventListener('canplay', () => {
        audio.currentTime = localTime;
        bookTime.set(initialTime);
      }, { once: true });
    }

    clockCleanup = createClock(audio, (localT) => {
      bookTime.set(currentTrackOffset + localT);
    }).destroy;

    setupMediaSession();

    const syncCleanup = initProgressSync(data.session.id, data.item.id, data.session.currentTime);

    loadSubtitles();

    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const t = get(bookTime);
      switch (e.key) {
        case ' ': e.preventDefault(); onPlayPause(); break;
        case 'ArrowLeft': doSeek(t - 10); break;
        case 'ArrowRight': doSeek(t + 10); break;
        case 'j': case 'J': doSeek(t - 30); break;
        case 'l': case 'L': doSeek(t + 30); break;
        case 'ArrowUp': onVolumeChange(Math.min(1, get(playerState).volume + 0.05)); break;
        case 'ArrowDown': onVolumeChange(Math.max(0, get(playerState).volume - 0.05)); break;
        case ',': case '<': onRateChange(Math.max(0.5, get(playerState).rate - 0.25)); break;
        case '.': case '>': onRateChange(Math.min(2, get(playerState).rate + 0.25)); break;
      }
    }
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      clockCleanup?.();
      hls?.destroy();
      syncCleanup.destroy();
    };
  });

  function setupHls(url: string, localTime: number, initialTime: number) {
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        function onSeeked() {
          audio.removeEventListener('seeked', onSeeked);
          bookTime.set(initialTime);
        }
        audio.addEventListener('seeked', onSeeked);
        audio.currentTime = localTime;
      });
      hls.on(Hls.Events.ERROR, (_ev, data) => {
        if (data.fatal) {
          error = `HLS error: ${data.type} - ${data.details}`;
          hls?.destroy();
          hls = null;
        }
      });
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = url;
      audio.load();
      audio.addEventListener('canplay', () => {
        audio.currentTime = localTime;
        bookTime.set(initialTime);
      }, { once: true });
    }
  }

  function doSeek(target: number) {
    const clamped = Math.max(0, Math.min(target, duration));
    const result = locateTrack(tracks, clamped);
    if (!result || !result.track) return;
    const { track, localTime } = result;
    currentTrackOffset = track.startOffset;

    const newSrc = streamUrl(data.item.id, track.ino);

    if (track.mimeType.includes('mpegurl')) {
      hls?.destroy();
      hls = null;
      setupHls(newSrc, localTime, clamped);
    } else if (audio.src !== newSrc) {
      audio.src = newSrc;
      audio.load();
      audio.addEventListener('canplay', () => {
        audio.currentTime = localTime;
        bookTime.set(clamped);
      }, { once: true });
    } else {
      audio.currentTime = localTime;
      bookTime.set(clamped);
    }
  }

  let playPromise: Promise<void> | null = null;

  function onPlayPause() {
    if (audio.paused) {
      playPromise = audio.play();
      playPromise.catch((e) => {
        if (e.name !== 'AbortError') {
          error = `Playback failed: ${e.message}`;
        }
      });
      playerState.update((s) => ({ ...s, playing: true }));
    } else {
      audio.pause();
      playerState.update((s) => ({ ...s, playing: false }));
    }
  }

  function onRateChange(rate: number) {
    audio.playbackRate = rate;
    playerState.update((s) => ({ ...s, rate }));
  }

  function onVolumeChange(vol: number) {
    audio.volume = vol;
    playerState.update((s) => ({ ...s, volume: vol }));
    localStorage.setItem('syncspeak_volume', String(vol));
  }

  function formatTime(s: number): string {
    if (!isFinite(s) || s < 0) s = 0;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${m}:${String(sec).padStart(2, '0')}`;
  }

  let showChapters = $state(false);
  let showSettings = $state(false);

  let subtitleTrack = $state<SubtitleTrack | null>(null);
  let subtitleCandidates = $state<Array<{ ino: string; filename: string; rank: number }>>([]);
  let subtitleLoading = $state(false);

  async function loadSubtitles() {
    const sub = data.subtitle;
    if (!sub) return;

    subtitleCandidates = sub.candidates ?? [];
    const starts = new Float64Array(sub.cues.length);
    for (let i = 0; i < sub.cues.length; i++) starts[i] = sub.cues[i].start;

    subtitleTrack = {
      id: sub.candidates?.[0]?.ino ?? 'server',
      source: 'abs',
      label: sub.label,
      offsetMs: (() => {
        const stored = localStorage.getItem(`offset:${data.item.id}`);
        return stored != null ? Number(stored) : (sub.offsetMs ?? 0);
      })(),
      cues: sub.cues,
      starts,
      wordLevel: sub.wordLevel
    };
  }

  async function onUploadSubtitle(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    subtitleLoading = true;
    try {
      const text = await file.text();
      const cues = parseSubtitleText(text, file.name);
      const starts = new Float64Array(cues.length);
      for (let i = 0; i < cues.length; i++) starts[i] = cues[i].start;

      subtitleTrack = {
        id: file.name,
        source: 'upload',
        label: file.name,
        offsetMs: 0,
        cues,
        starts,
        wordLevel: cues.some((c) => c.words.length > 0)
      };
    } catch {
      error = 'Failed to parse subtitle file';
    } finally {
      subtitleLoading = false;
    }
  }

  function adjustOffset(delta: number) {
    if (!subtitleTrack) return;
    subtitleTrack = { ...subtitleTrack, offsetMs: subtitleTrack.offsetMs + delta * 1000 };
  }

  async function selectSubtitle(ino: string) {
    subtitleLoading = true;
    try {
      const res = await fetch(`/api/subtitles/${data.item.id}?ino=${ino}`);
      const json = await res.json();
      const starts = new Float64Array(json.cues.length);
      for (let i = 0; i < json.cues.length; i++) starts[i] = json.cues[i].start;

      subtitleTrack = {
        id: ino,
        source: 'abs',
        label: json.label ?? ino,
        offsetMs: subtitleTrack?.offsetMs ?? 0,
        cues: json.cues,
        starts,
        wordLevel: json.wordLevel
      };
    } catch {
      subtitleTrack = null;
    } finally {
      subtitleLoading = false;
    }
  }

  async function saveOffset(ms: number) {
    localStorage.setItem(`offset:${data.item.id}`, String(ms));
    try {
      await fetch('/api/prefs/offset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: data.item.id, offsetMs: ms })
      });
    } catch { /* ponytail: non-critical */ }
  }
</script>

<audio bind:this={audio} preload="auto" class="hidden"></audio>
<audio bind:this={preloadAudio} preload="auto" class="hidden"></audio>

{#if error}
  <div class="fixed top-4 right-4 z-50 max-w-sm rounded-lg border border-red-400 bg-red-950 p-4 text-sm text-red-300">
    <p class="font-semibold">Playback Error</p>
    <p>{error}</p>
  </div>
{/if}

<SubtitleSettings bind:open={showSettings} />

<div class="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 z-50">
  <div class="mx-auto max-w-4xl space-y-3">
    <div class="flex items-center gap-3">
      <span class="text-xs text-muted w-12 text-right tabular-nums">
        {formatTime($displayTime)}
      </span>
      <input
        type="range"
        min="0"
        max={duration}
        value={$bookTime}
        onchange={(e) => doSeek(Number(e.currentTarget.value))}
        class="flex-1 h-1 accent-accent cursor-pointer"
      />
      <span class="text-xs text-muted w-12 tabular-nums">
        {formatTime(duration)}
      </span>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button onclick={onPlayPause} class="rounded-full bg-accent p-3 text-bg hover:opacity-90">
          {#if $playerState.playing}
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          {:else}
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          {/if}
        </button>

        <button onclick={() => doSeek(get(bookTime) - 10)} class="rounded p-2 text-muted hover:text-fg" title="Back 10s">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"/></svg>
        </button>
        <button onclick={() => doSeek(get(bookTime) + 10)} class="rounded p-2 text-muted hover:text-fg" title="Forward 10s">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"/></svg>
        </button>

        <div class="flex items-center gap-2 ml-4">
          <label for="volume" class="text-xs text-muted">{Math.round($playerState.volume * 100)}%</label>
          <input
            id="volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={$playerState.volume}
            oninput={(e) => onVolumeChange(Number(e.currentTarget.value))}
            class="w-20 h-1 accent-accent cursor-pointer"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <select
          value={$playerState.rate}
          onchange={(e) => onRateChange(Number(e.currentTarget.value))}
          class="rounded border border-border bg-bg px-2 py-1 text-xs text-fg"
        >
          {#each [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as r}
            <option value={r}>{r}x</option>
          {/each}
        </select>

        <button
          onclick={() => showChapters = !showChapters}
          class="rounded p-2 text-muted hover:text-fg text-sm"
        >
          Chapters
        </button>

        <button
          onclick={() => showSettings = !showSettings}
          class="rounded p-2 text-muted hover:text-fg text-sm"
          title="Subtitle settings"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </button>
      </div>
    </div>

    {#if showChapters}
      <div class="max-h-48 overflow-y-auto rounded border border-border bg-bg p-2">
        {#each chapters as ch}
          <button
            onclick={() => { doSeek(ch.start); showChapters = false; }}
            class="w-full text-left px-3 py-1.5 rounded text-sm hover:bg-surface text-fg"
            class:bg-surface={$bookTime >= ch.start && $bookTime < ch.end}
          >
            {ch.title}
            <span class="text-xs text-muted ml-2">{formatTime(ch.start)}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<div class="pb-32 px-4 pt-6 max-w-4xl mx-auto">
  <a href="/book/{data.item.id}" class="text-sm text-muted hover:text-fg">&larr; Book Details</a>
  <h1 class="text-xl font-bold mt-2">{data.item.title}</h1>
  {#if data.item.author}
    <p class="text-sm text-muted">{data.item.author}</p>
  {/if}
  <div class="mt-6">
    {#if subtitleLoading}
      <p class="text-muted text-sm">Loading subtitles...</p>
    {:else if subtitleTrack}
      <LyricsPane track={subtitleTrack} onSeek={doSeek} />
      <div class="mt-4 flex items-center gap-3 rounded border border-border bg-surface p-3 flex-wrap">
        <span class="text-xs text-muted">Offset:</span>
        <button
          onclick={() => adjustOffset(-0.1)}
          class="rounded bg-bg border border-border px-2 py-0.5 text-xs text-fg hover:border-accent"
        >-0.1s</button>
        <input
          type="range"
          min={-30}
          max={30}
          step={0.1}
          value={subtitleTrack.offsetMs / 1000}
          oninput={(e) => {
            const newOffset = Number(e.currentTarget.value) * 1000;
            subtitleTrack = { ...subtitleTrack!, offsetMs: newOffset };
          }}
          class="flex-1 min-w-24 h-1 accent-accent cursor-pointer"
        />
        <button
          onclick={() => adjustOffset(0.1)}
          class="rounded bg-bg border border-border px-2 py-0.5 text-xs text-fg hover:border-accent"
        >+0.1s</button>
        <input
          type="number"
          step={0.1}
          value={(subtitleTrack.offsetMs / 1000).toFixed(1)}
          oninput={(e) => {
            const val = Number(e.currentTarget.value);
            if (isFinite(val) && val >= -30 && val <= 30) {
              subtitleTrack = { ...subtitleTrack!, offsetMs: val * 1000 };
            }
          }}
          class="w-16 rounded border border-border bg-bg px-2 py-0.5 text-xs text-fg text-center focus:border-accent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span class="text-xs text-muted">s</span>
        <button
          onclick={() => { subtitleTrack = { ...subtitleTrack!, offsetMs: 0 }; }}
          class="rounded bg-bg border border-border px-2 py-0.5 text-xs text-fg hover:border-accent"
        >Reset</button>
        <button
          onclick={() => saveOffset(subtitleTrack!.offsetMs)}
          class="rounded bg-accent px-2 py-0.5 text-xs font-semibold text-bg hover:opacity-90"
        >Save</button>
      </div>
    {:else if subtitleCandidates.length > 0}
      <div class="space-y-2">
        <p class="text-sm text-muted">Select subtitle:</p>
        {#each subtitleCandidates as c}
          <button
            onclick={() => selectSubtitle(c.ino)}
            class="block w-full text-left rounded border border-border bg-surface px-3 py-2 text-sm text-fg hover:border-accent"
          >
            {c.filename}
          </button>
        {/each}
      </div>
    {:else}
      <div class="space-y-3">
        <p class="text-muted text-sm">No subtitles found for this book.</p>
        <div class="border border-dashed border-border rounded-lg p-6 text-center">
          <p class="text-xs text-muted mb-2">Upload .srt or .vtt file</p>
          <input
            type="file"
            accept=".srt,.vtt"
            onchange={onUploadSubtitle}
            class="text-xs text-fg file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1 file:text-xs file:font-semibold file:text-bg"
          />
        </div>
      </div>
    {/if}
  </div>
</div>
