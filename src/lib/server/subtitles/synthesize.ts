import type { Cue, Word } from '$lib/types';

export function synthesizeWords(cues: Cue[]): Cue[] {
  return cues.map((cue) => {
    if (cue.words.length > 0) return cue;

    const tokens = cue.text.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return cue;

    const PER_WORD = 0.04;
    const PUNCT_PAUSE = 0.12;

    const weights = tokens.map((w) => {
      const chars = w.replace(/[^\p{L}\p{N}]/gu, '').length + 1;
      return chars + (/[.!?;:]$/.test(w) ? PUNCT_PAUSE * 10 : 0);
    });

    const total = weights.reduce((a, b) => a + b, 0);
    const span = Math.max(cue.end - cue.start - PER_WORD * tokens.length, 0.01);

    let t = cue.start;
    const words: Word[] = tokens.map((text, k) => {
      const d = (weights[k] / total) * span + PER_WORD;
      const w = { t, d, text };
      t += d;
      return w;
    });

    return { ...cue, words };
  });
}
