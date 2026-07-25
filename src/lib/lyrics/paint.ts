import type { Word } from '$lib/types';

export function createPainter(duration: number) {
  let spans: HTMLElement[] = [];
  let words: Word[] = [];
  let paintedUpTo = -1;

  return {
    bind(newSpans: HTMLElement[], newWords: Word[]) {
      spans = newSpans;
      words = newWords;
      paintedUpTo = -1;
    },

    paint(t: number) {
      if (!spans.length || !words.length) return;

      let k = -1;
      for (let j = 0; j < words.length; j++) {
        if (words[j].t <= t) k = j;
        else break;
      }

      if (k === paintedUpTo) return;

      const from = Math.min(k, paintedUpTo) + 1;
      const to = Math.max(k, paintedUpTo);

      for (let j = from; j <= to; j++) {
        spans[j]?.classList.toggle('spoken', j <= k);
      }

      // partial fill on current word
      if (k >= 0 && k < words.length) {
        const w = words[k];
        if (t >= w.t && w.d > 0) {
          const progress = Math.min((t - w.t) / w.d, 1);
          spans[k]?.style.setProperty('--p', `${progress * 100}%`);
        }
      }

      paintedUpTo = k;
    },

    reset() {
      for (const span of spans) {
        span.classList.remove('spoken');
        span.style.removeProperty('--p');
      }
      paintedUpTo = -1;
    }
  };
}
