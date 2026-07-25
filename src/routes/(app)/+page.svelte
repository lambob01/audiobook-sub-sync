<script lang="ts">
  let { data } = $props();
</script>

<div class="space-y-8">
  <h1 class="text-3xl font-bold">Continue Listening</h1>

  {#if data.error}
    <p class="text-red-400">{data.error}</p>
  {:else if !data.libraries?.length}
    <p class="text-muted">No libraries found. Make sure your Audiobookshelf server has book libraries.</p>
  {/if}

  {#each data.libraries as lib}
    <section>
      <a
        href="/library/{lib.id}"
        class="text-xl font-semibold text-accent hover:underline"
      >
        {lib.name}
      </a>
      <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {#each lib.recent ?? [] as item}
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
    </section>
  {/each}
</div>
