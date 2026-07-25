<script lang="ts">
  import { enhance } from '$app/forms';
  let { form } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-bg">
  <form
    method="POST"
    use:enhance
    class="w-full max-w-sm space-y-4 rounded-lg bg-surface p-8 shadow-lg border border-border"
  >
    <h1 class="text-2xl font-bold text-center">syncspeak</h1>

    <label class="block">
      <span class="text-sm text-muted">Audiobookshelf Server URL</span>
      <input
        name="absUrl"
        type="url"
        placeholder="https://abs.example.com"
        required
        class="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-fg placeholder:text-muted focus:border-accent focus:outline-none"
      />
    </label>

    <label class="block">
      <span class="text-sm text-muted">Username</span>
      <input
        name="username"
        type="text"
        required
        class="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-fg focus:border-accent focus:outline-none"
      />
    </label>

    <label class="block">
      <span class="text-sm text-muted">Password</span>
      <input
        name="password"
        type="password"
        required
        class="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-fg focus:border-accent focus:outline-none"
      />
    </label>

    {#if form?.error}
      <p class="text-sm text-red-400">{String(form.error)}</p>
    {/if}

    <button
      type="submit"
      class="w-full rounded bg-accent px-4 py-2 font-semibold text-bg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent"
    >
      Sign In
    </button>
  </form>
</div>
