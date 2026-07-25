<script lang="ts">
  import { onMount } from 'svelte';

  let { data } = $props();

  let continueItems = $state<Array<{
    id: string; libraryId: string; title: string; author: string;
    coverPath?: string; currentTime: number; duration: number; percent: number;
  }>>([]);

  onMount(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('syncspeak_progress') ?? '{}');
      const items: typeof continueItems = [];

      for (const lib of data.libraries) {
        for (const item of (lib as { items: Array<{ id: string; media: { metadata: { title: string; authorName?: string; duration: number }; coverPath?: string } }> }).items ?? []) {
          const prog = stored[item.id];
          if (prog && prog.time > 60) { // at least 1 minute listened
            items.push({
              id: item.id,
              libraryId: lib.id,
              title: item.media.metadata.title,
              author: item.media.metadata.authorName ?? '',
              coverPath: item.media.coverPath,
              currentTime: prog.time,
              duration: item.media.metadata.duration || prog.time * 2,
              percent: item.media.metadata.duration > 0 ? (prog.time / item.media.metadata.duration) * 100 : 0
            });
          }
        }
      }

      items.sort((a, b) => b.currentTime - a.currentTime);
      continueItems = items;
    } catch { /* ignore */ }
  });

  function formatTime(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
</script>

<div class="space-y-8">
  {#if data.error}
    <p class="text-red-400">{data.error}</p>
  {/if}

  {#if continueItems.length > 0}
    <section>
      <h2 class="text-2xl font-bold mb-4">Continue Listening</h2>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {#each continueItems as item}
          <a
            href="/listen/{item.id}"
            class="group rounded-lg bg-surface border border-border p-2 hover:border-accent transition-colors"
          >
            <div class="aspect-[3/4] rounded-md bg-border overflow-hidden mb-2 relative">
              {#if item.coverPath}
                <img src="/api/cover/{item.id}" alt="" class="h-full w-full object-cover" loading="lazy" />
              {/if}
              <div class="absolute bottom-0 left-0 right-0 h-1 bg-bg/50">
                <div class="h-full bg-accent" style="width: {Math.min(item.percent, 100)}%"></div>
              </div>
            </div>
            <p class="text-sm font-medium truncate">{item.title}</p>
            <p class="text-xs text-muted truncate">{item.author}</p>
            <p class="text-xs text-accent mt-0.5">{formatTime(item.currentTime)} left</p>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  {#each data.libraries as lib}
    <section>
      <a href="/library/{lib.id}" class="text-xl font-semibold text-accent hover:underline">{lib.name}</a>
      <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {#each (lib as { items?: Array<{ id: string; media: { metadata: { title: string; authorName?: string }; coverPath?: string } }> }).items ?? [] as item}
          <a
            href="/book/{item.id}"
            class="group rounded-lg bg-surface border border-border p-2 hover:border-accent transition-colors"
          >
            <div class="aspect-[3/4] rounded-md bg-border overflow-hidden mb-2">
              {#if item.media?.coverPath}
                <img src="/api/cover/{item.id}" alt="" class="h-full w-full object-cover" loading="lazy" />
              {/if}
            </div>
            <p class="text-sm font-medium truncate">{item.media.metadata.title}</p>
            <p class="text-xs text-muted truncate">{item.media.metadata.authorName ?? ''}</p>
          </a>
        {/each}
      </div>
    </section>
  {/each}

  {#if !data.libraries?.length && !data.error}
    <p class="text-muted">No libraries found. Make sure your Audiobookshelf server has book libraries.</p>
  {/if}
</div>
