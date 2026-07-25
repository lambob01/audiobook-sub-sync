<script lang="ts">
  let { data } = $props();
  const item = $derived(data.item);
</script>

<div class="space-y-6">
  <a href="/" class="text-sm text-muted hover:text-fg">&larr; Back</a>

  <div class="flex flex-col gap-6 sm:flex-row">
    <div class="w-48 shrink-0">
      <div class="aspect-[3/4] rounded-lg bg-border overflow-hidden">
        {#if item.media?.coverPath}
          <img
            src="/api/cover/{item.id}"
            alt=""
            class="h-full w-full object-cover"
          />
        {/if}
      </div>
    </div>

    <div class="flex-1 space-y-4">
      <h1 class="text-3xl font-bold">{item.media.metadata.title}</h1>

      {#if item.media.metadata.authorName}
        <p class="text-lg text-muted">by {item.media.metadata.authorName}</p>
      {/if}
      {#if item.media.metadata.narratorName}
        <p class="text-sm text-muted">Narrated by {item.media.metadata.narratorName}</p>
      {/if}

      {#if item.media.metadata.genres?.length}
        <div class="flex flex-wrap gap-2">
          {#each item.media.metadata.genres as genre}
            <span class="rounded-full bg-surface border border-border px-3 py-0.5 text-xs text-muted">
              {genre}
            </span>
          {/each}
        </div>
      {/if}

      {#if item.media.metadata.description}
        <p class="text-sm text-muted leading-relaxed max-w-prose line-clamp-6">
          {item.media.metadata.description}
        </p>
      {/if}

      <div class="flex gap-4 text-sm text-muted">
        {#if item.media.metadata.duration}
          <span>{Math.round(item.media.metadata.duration / 3600)}h {Math.round((item.media.metadata.duration % 3600) / 60)}m</span>
        {/if}
        {#if item.media.numTracks > 0}
          <span>{item.media.numTracks} tracks</span>
        {/if}
      </div>

      {#if item.progress?.currentTime}
        <div class="pt-2">
          <p class="text-sm text-muted">
            Progress: {formatTime(item.progress.currentTime)} / {formatTime(item.progress.duration)}
          </p>
          <div class="mt-1 h-1 w-full max-w-md rounded-full bg-border">
            <div
              class="h-full rounded-full bg-accent"
              style="width: {item.progress.duration ? (item.progress.currentTime / item.progress.duration) * 100 : 0}%"
            ></div>
          </div>
        </div>
      {/if}

      <a
        href="/listen/{item.id}"
        class="inline-block rounded bg-accent px-6 py-2 font-semibold text-bg hover:opacity-90 transition-opacity"
      >
        {item.progress?.currentTime && !item.progress?.isFinished ? 'Resume' : 'Play'}
      </a>
    </div>
  </div>
</div>

<script lang="ts" module>
  function formatTime(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
</script>
