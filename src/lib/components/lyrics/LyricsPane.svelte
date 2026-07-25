<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { bookTime, playerState } from '$lib/stores/player';
  import { showJumpPill } from '$lib/stores/ui';
  import { activeCueIndex } from '$lib/stores/subtitles';
  import { makeLocator } from '$lib/lyrics/locator';
  import { createScrollController } from '$lib/lyrics/scroll-controller';
  import LyricsLine from './LyricsLine.svelte';
  import JumpToCurrent from './JumpToCurrent.svelte';
  import type { SubtitleTrack, Cue } from '$lib/types';

  let { track, onSeek }: { track: SubtitleTrack; onSeek: (t: number) => void } = $props();

  let container: HTMLElement;
  let locator = $state(makeLocator(track));
  let scrollCtrl: ReturnType<typeof createScrollController> | null = null;
  let currentIndex = $state(-1);
  let currentTime = $state(0);
  let suppressLocatorUntil = 0;

  // ponytail: render all cues, let browser handle scroll. Add virtualization when >20k cues causes perf issues.
  onMount(() => {
    scrollCtrl = createScrollController(container, () => get(playerState).rate);

    const unsub = bookTime.subscribe((t) => {
      currentTime = t;
      if (Date.now() < suppressLocatorUntil) return;

      const adjusted = t - track.offsetMs / 1000;
      const idx = locator(adjusted);
      if (idx !== currentIndex && idx >= 0) {
        currentIndex = idx;
        activeCueIndex.set(idx);
        const lineEl = container.querySelector(`[data-index="${idx}"]`) as HTMLElement;
        if (lineEl && scrollCtrl) scrollCtrl.scrollToLine(lineEl);
      }
    });

    const t0 = get(bookTime);
    const initialIdx = locator(t0 - track.offsetMs / 1000);
    if (initialIdx >= 0) {
      currentIndex = initialIdx;
      activeCueIndex.set(initialIdx);
      setTimeout(() => {
        const lineEl = container.querySelector(`[data-index="${initialIdx}"]`) as HTMLElement;
        if (lineEl) container.scrollTo({ top: lineEl.offsetTop - container.clientHeight * 0.4 });
      }, 50);
    }

    return () => {
      unsub();
      scrollCtrl?.destroy();
    };
  });

  function handleCueClick(cue: Cue) {
    const idx = currentIndex >= 0 && track.cues[currentIndex]?.i === cue.i
      ? currentIndex : locator(cue.start);
    currentIndex = idx;
    activeCueIndex.set(idx);
    suppressLocatorUntil = Date.now() + 600;
    scrollCtrl?.suppressOnSeek();
    scrollCtrl?.jumpToCurrent();
    onSeek(cue.start + track.offsetMs / 1000);
  }

  function handleJumpToCurrent() {
    scrollCtrl?.jumpToCurrent();
    const idx = get(activeCueIndex);
    if (idx >= 0) {
      const lineEl = container.querySelector(`[data-index="${idx}"]`) as HTMLElement;
      if (lineEl) container.scrollTo({ top: lineEl.offsetTop - container.clientHeight * 0.4, behavior: 'smooth' });
    }
  }

  const adjustedTime = $derived(currentTime - track.offsetMs / 1000);
  const debugActiveCue = $derived(currentIndex >= 0 ? track.cues[currentIndex] : null);
  const debugWordInfo = $derived(() => {
    if (!debugActiveCue || !debugActiveCue.words?.length) return '';
    const firstWord = debugActiveCue.words[0];
    const lastWord = debugActiveCue.words[debugActiveCue.words.length - 1];
    const spokenCount = debugActiveCue.words.filter((w: { t: number; d: number; text: string }) => adjustedTime >= w.t).length;
    return `${spokenCount}/${debugActiveCue.words.length} words spoken | word[0].t=${firstWord.t.toFixed(2)}s | audio at ${adjustedTime.toFixed(2)}s`;
  });
</script>

<div class="relative">
  {#if debugActiveCue && currentIndex >= 0}
    <div class="text-xs text-muted mb-2 space-y-0.5">
      <div>Time: {adjustedTime.toFixed(1)}s | Cue #{currentIndex}: "{debugActiveCue.text.slice(0, 40)}..." ({debugActiveCue.start.toFixed(1)}–{debugActiveCue.end.toFixed(1)}s)</div>
      <div>{debugWordInfo()}</div>
    </div>
  {/if}
  <div
    bind:this={container}
    class="overflow-y-auto max-h-[40vh] sm:max-h-[60vh] rounded-lg bg-bg/50"
    role="list"
    aria-live="off"
  >
    {#each track.cues as cue, i (cue.i)}
      <div data-index={i}>
        <LyricsLine
          {cue}
          state={i < currentIndex ? 'past' : i === currentIndex ? 'active' : 'future'}
          onclick={() => handleCueClick(cue)}
          currentTime={adjustedTime}
        />
      </div>
    {/each}
  </div>

  {#if $showJumpPill}
    <JumpToCurrent onclick={handleJumpToCurrent} />
  {/if}
</div>
