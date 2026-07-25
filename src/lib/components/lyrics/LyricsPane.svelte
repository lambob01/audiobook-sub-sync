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

  const ROW_HEIGHT = 40; // px per cue line
  const WINDOW = 300;    // cues above and below current

  let container: HTMLElement;
  let locator = $state(makeLocator(track));
  let scrollCtrl: ReturnType<typeof createScrollController> | null = null;
  let currentIndex = $state(-1);
  let currentTime = $state(0);
  let suppressLocatorUntil = 0;
  let windowStart = $state(0);
  let windowEnd = $state(WINDOW * 2);

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
        snapWindow(idx);
        scrollToIdx(idx);
      }
    });

    const t0 = get(bookTime);
    const initialIdx = locator(t0 - track.offsetMs / 1000);
    if (initialIdx >= 0) {
      currentIndex = initialIdx;
      activeCueIndex.set(initialIdx);
      snapWindow(initialIdx);
      setTimeout(() => { container.scrollTop = initialIdx * ROW_HEIGHT - container.clientHeight * 0.4; }, 50);
    }

    return () => {
      unsub();
      scrollCtrl?.destroy();
    };
  });

  function snapWindow(idx: number) {
    const mid = Math.floor((windowStart + windowEnd) / 2);
    if (idx < windowStart + 50 || idx > windowEnd - 50) {
      windowStart = Math.max(0, idx - WINDOW);
      windowEnd = Math.min(track.cues.length, idx + WINDOW);
    }
  }

  function scrollToIdx(idx: number) {
    scrollCtrl?.ignoreNext();
    container.scrollTo({ top: idx * ROW_HEIGHT - container.clientHeight * 0.4, behavior: 'smooth' });
  }

  function handleCueClick(cue: Cue) {
    const idx = currentIndex >= 0 && track.cues[currentIndex]?.i === cue.i
      ? currentIndex : locator(cue.start);
    currentIndex = idx;
    activeCueIndex.set(idx);
    snapWindow(idx);
    suppressLocatorUntil = Date.now() + 600;
    scrollCtrl?.suppressOnSeek();
    scrollCtrl?.jumpToCurrent();
    onSeek(cue.start + track.offsetMs / 1000);
  }

  function handleJumpToCurrent() {
    scrollCtrl?.jumpToCurrent();
    const idx = get(activeCueIndex);
    if (idx >= 0) {
      container.scrollTo({ top: idx * ROW_HEIGHT - container.clientHeight * 0.4, behavior: 'smooth' });
    }
  }

  const adjustedTime = $derived(currentTime - track.offsetMs / 1000);
  const debugActiveCue = $derived(currentIndex >= 0 ? track.cues[currentIndex] : null);
  const visibleCues = $derived(track.cues.slice(windowStart, windowEnd));
</script>

<div class="relative">
  {#if debugActiveCue && currentIndex >= 0}
    <div class="text-xs text-muted mb-2">
      Time: {adjustedTime.toFixed(1)}s | Cue #{currentIndex}: "{debugActiveCue.text.slice(0, 40)}..." ({debugActiveCue.start.toFixed(1)}–{debugActiveCue.end.toFixed(1)}s)
    </div>
  {/if}
  <div
    bind:this={container}
    class="overflow-y-auto max-h-[40vh] sm:max-h-[60vh] rounded-lg bg-bg/50"
    role="list"
    aria-live="off"
  >
    <!-- pylint spacer top -->
    <div style="height: {windowStart * ROW_HEIGHT}px"></div>
    {#each visibleCues as cue (cue.i)}
      <div data-index={cue.i} style="height: {ROW_HEIGHT}px">
        <LyricsLine
          {cue}
          state={cue.i < currentIndex ? 'past' : cue.i === currentIndex ? 'active' : 'future'}
          onclick={() => handleCueClick(cue)}
          currentTime={cue.i === currentIndex ? adjustedTime : Number.NEGATIVE_INFINITY}
        />
      </div>
    {/each}
    <!-- pylint spacer bottom -->
    <div style="height: {(track.cues.length - windowEnd) * ROW_HEIGHT}px"></div>
  </div>

  {#if $showJumpPill}
    <JumpToCurrent onclick={handleJumpToCurrent} />
  {/if}
</div>
