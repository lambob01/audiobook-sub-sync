<script lang="ts">
  let { onclick }: { onclick: () => void } = $props();
</script>

<button
  {onclick}
  class="fixed bottom-24 right-4 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bg shadow-lg hover:opacity-90 transition-opacity z-50 animate-bounce"
>
  Jump to current
</button>
