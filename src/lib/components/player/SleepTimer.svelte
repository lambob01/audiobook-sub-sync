<script lang="ts">
  import { sleepTimer, startSleepTimer, clearSleepTimer, getRemaining } from '$lib/player/sleep-timer';
  import { playerState } from '$lib/stores/player';

  let { onPause }: { onPause: () => void } = $props();
  let open = $state(false);

  function setTimer(mins: number) {
    startSleepTimer(mins, 'timer', onPause);
    open = false;
  }
</script>

<div class="relative">
  <button
    onclick={() => open = !open}
    class="rounded p-2 text-muted hover:text-fg text-sm"
    title="Sleep timer"
  >
    {#if $sleepTimer}
      {Math.ceil(getRemaining())}m
    {:else}
      Zzz
    {/if}
  </button>

  {#if open}
    <div class="absolute bottom-full right-0 mb-2 rounded border border-border bg-surface p-3 shadow-lg">
      <p class="text-xs text-muted mb-2">Stop after</p>
      <div class="flex gap-2">
        {#each [15, 30, 45, 60] as mins}
          <button
            onclick={() => setTimer(mins)}
            class="rounded bg-bg border border-border px-2 py-1 text-xs text-fg hover:border-accent"
          >
            {mins}m
          </button>
        {/each}
      </div>
      <button
        onclick={() => { startSleepTimer(0, 'chapter', onPause); open = false; }}
        class="mt-2 w-full rounded bg-bg border border-border px-2 py-1 text-xs text-fg hover:border-accent"
      >
        End of chapter
      </button>
      {#if $sleepTimer}
        <button
          onclick={() => { clearSleepTimer(); open = false; }}
          class="mt-1 w-full rounded bg-bg border border-border px-2 py-1 text-xs text-red-400 hover:border-red-400"
        >
          Cancel timer
        </button>
      {/if}
    </div>
  {/if}
</div>
