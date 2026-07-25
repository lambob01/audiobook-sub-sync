<script lang="ts">
  let { word, currentTime = Number.NEGATIVE_INFINITY } = $props<{
    word: { t: number; d: number; text: string };
    currentTime?: number;
  }>();

  const spoken = $derived(currentTime >= word.t);
</script>

<span class="word inline {spoken ? 'spoken' : ''}" role="presentation">{word.text}</span>
