<script lang="ts">
  import WordSpan from './WordSpan.svelte';
  import type { Cue } from '$lib/types';
  import { subtitlePrefs } from '$lib/stores/subtitle-prefs';

  let { cue, state, onclick, currentTime = Number.NEGATIVE_INFINITY } = $props<{
    cue: Cue;
    state: 'past' | 'active' | 'future';
    onclick: () => void;
    currentTime?: number;
  }>();

  let el: HTMLElement;
  const prefs = $derived($subtitlePrefs);

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onclick();
  }
</script>

<button
  bind:this={el}
  type="button"
  onclick={handleClick}
  class="line w-full text-left px-2 sm:px-4 py-1 sm:py-1.5 transition-opacity duration-200"
  class:past={state === 'past'}
  class:active={state === 'active'}
  class:future={state === 'future'}
  aria-current={state === 'active' ? 'true' : undefined}
  style="font-size:{prefs.fontSize}px;line-height:{prefs.lineHeight};font-weight:{state === 'active' ? prefs.activeWeight : 400}"
>
  <span class="text-xs text-muted mr-3 tabular-nums select-none align-top opacity-60">
    {formatTimestamp(cue.start)}
  </span>
  <span class="text-fg leading-relaxed" style="word-spacing:{prefs.wordGap}rem">
    {#if cue.words?.length > 0}
      {#each cue.words as word}
        <WordSpan {word} {currentTime} />
      {/each}
    {:else}
      {cue.text}
    {/if}
  </span>
</button>

<script lang="ts" module>
  function formatTimestamp(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
</script>
