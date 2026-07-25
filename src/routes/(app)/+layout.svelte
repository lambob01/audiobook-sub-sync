<script lang="ts">
  let { children } = $props();
</script>

<div class="min-h-screen bg-bg">
  <nav class="flex items-center justify-between border-b border-border px-6 py-3 bg-surface">
    <a href="/" class="text-lg font-bold text-accent">syncspeak</a>
    <div class="flex items-center gap-4">
      <a href="/logout" class="text-sm text-muted hover:text-fg">Sign out</a>
    </div>
  </nav>
  <main class="mx-auto max-w-7xl px-4 py-6">
    {@render children()}
  </main>
</div>
