<script lang="ts">
  let { data } = $props();
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <a href="/" class="text-sm text-muted hover:text-fg">&larr; Libraries</a>
      <h1 class="text-2xl font-bold">{data.library?.name ?? 'Library'}</h1>
    </div>
  </div>

  <form method="GET" class="flex flex-wrap gap-3">
    <input
      name="filter"
      type="search"
      placeholder="Search..."
      class="rounded border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none flex-1 min-w-0"
    />
    <select
      name="sort"
      class="rounded border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
    >
      <option value="media.metadata.title">Title</option>
      <option value="media.metadata.authorName">Author</option>
      <option value="recent">Recent</option>
    </select>
    <button
      type="submit"
      class="rounded bg-accent px-4 py-2 text-sm font-semibold text-bg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent"
    >
      Filter
    </button>
  </form>

  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
    {#each data.items.results as item}
      <a
        href="/book/{item.id}"
        class="group rounded-lg bg-surface border border-border p-2 hover:border-accent transition-colors"
      >
        <div class="aspect-[3/4] rounded-md bg-border overflow-hidden mb-2">
          {#if item.media?.coverPath}
            <img
              src="/api/cover/{item.id}"
              alt=""
              class="h-full w-full object-cover"
              loading="lazy"
            />
          {/if}
        </div>
        <p class="text-sm font-medium truncate">{item.media.metadata.title}</p>
        <p class="text-xs text-muted truncate">{item.media.metadata.authorName ?? ''}</p>
      </a>
    {/each}
  </div>

  {#if data.items.total > 24}
    <div class="flex justify-center gap-4 pt-4">
      <!-- pagination -->
      <div class="flex justify-center gap-3 items-center">
        {#if data.items.page > 0}
          <a href="?page={data.items.page - 1}" class="text-sm text-accent hover:underline">&larr; Previous</a>
        {:else}
          <span class="text-sm text-muted">&larr; Previous</span>
        {/if}
        <p class="text-sm text-muted">
          Page {data.items.page + 1} of {Math.ceil(data.items.total / 24)}
        </p>
        {#if (data.items.page + 1) * 24 < data.items.total}
          <a href="?page={data.items.page + 1}" class="text-sm text-accent hover:underline">Next &rarr;</a>
        {:else}
          <span class="text-sm text-muted">Next &rarr;</span>
        {/if}
      </div>
    </div>
  {/if}

  {#if data.items.results.length === 0}
    <p class="text-muted text-center py-12">No items found.</p>
  {/if}
</div>
