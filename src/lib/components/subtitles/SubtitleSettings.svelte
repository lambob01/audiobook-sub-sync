<script lang="ts">
  import { subtitlePrefs } from '$lib/stores/subtitle-prefs';
  import { get } from 'svelte/store';

  let { open = $bindable(undefined as boolean | undefined) }: { open?: boolean } = $props();
  let prefs = $state(get(subtitlePrefs));

  function save() {
    subtitlePrefs.set({ ...prefs });
  }

  function close() { open = false; }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex justify-end">
    <button class="absolute inset-0 bg-black/40 border-none cursor-pointer" onclick={close} aria-label="Close settings"></button>
    <div class="relative w-full sm:w-80 max-w-full bg-surface border-l border-border p-6 overflow-y-auto space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Subtitle Settings</h2>
        <button onclick={close} class="text-muted hover:text-fg text-lg leading-none">&times;</button>
      </div>

      <label class="block">
        <span class="text-sm">Font size: {prefs.fontSize}px</span>
        <input
          type="range" min="12" max="28" step="1" value={prefs.fontSize}
          oninput={(e) => { prefs.fontSize = Number(e.currentTarget.value); save(); }}
          class="w-full h-3 sm:h-1 accent-accent cursor-pointer mt-1"
        />
      </label>

      <label class="block">
        <span class="text-sm">Line height: {prefs.lineHeight.toFixed(1)}</span>
        <input
          type="range" min="1" max="2.5" step="0.1" value={prefs.lineHeight}
          oninput={(e) => { prefs.lineHeight = Number(e.currentTarget.value); save(); }}
          class="w-full h-3 sm:h-1 accent-accent cursor-pointer mt-1"
        />
      </label>

      <label class="block">
        <span class="text-sm">Active line weight: {prefs.activeWeight}</span>
        <input
          type="range" min="400" max="800" step="100" value={prefs.activeWeight}
          oninput={(e) => { prefs.activeWeight = Number(e.currentTarget.value); save(); }}
          class="w-full h-3 sm:h-1 accent-accent cursor-pointer mt-1"
        />
      </label>

      <label class="block">
        <span class="text-sm">Word spacing: {prefs.wordGap.toFixed(2)}rem</span>
        <input
          type="range" min="0" max="0.5" step="0.05" value={prefs.wordGap}
          oninput={(e) => { prefs.wordGap = Number(e.currentTarget.value); save(); }}
          class="w-full h-3 sm:h-1 accent-accent cursor-pointer mt-1"
        />
      </label>

      <div class="pt-4 border-t border-border">
        <p class="text-xs text-muted mb-2">Preview</p>
        <p
          style="font-size:{prefs.fontSize}px;line-height:{prefs.lineHeight};font-weight:{prefs.activeWeight};word-spacing:{prefs.wordGap}rem"
        >
          The quick brown fox.
        </p>
      </div>
    </div>
  </div>
{/if}
