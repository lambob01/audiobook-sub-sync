import type { Cue } from '$lib/types';

export function splitCues(cues: Cue[], maxDuration = 6): Cue[] {
  const result: Cue[] = [];

  for (const cue of cues) {
    const duration = cue.end - cue.start;
    if (duration <= maxDuration) {
      result.push({ ...cue, words: [] });
      continue;
    }

    const sentences = splitSentences(cue.text, cue.start, cue.end);

    if (sentences.length <= 1) {
      result.push({ ...cue, words: [] });
      continue;
    }

    for (const s of sentences) {
      result.push({
        i: result.length,
        start: s.start,
        end: s.end,
        text: s.text,
        words: []
      });
    }
  }

  return result;
}

function splitSentences(text: string, cueStart: number, cueEnd: number): { text: string; start: number; end: number }[] {
  const parts = text.split(/(?<=[.!?])\s+/);
  if (parts.length <= 1) return [{ text, start: cueStart, end: cueEnd }];

  const totalChars = text.length;
  const duration = cueEnd - cueStart;

  let offset = 0;
  return parts.map((part) => {
    const ratio = part.length / totalChars;
    const partDuration = ratio * duration;
    const partStart = cueStart + offset;
    const partEnd = partStart + partDuration;
    offset += partDuration;
    return { text: part.trim(), start: partStart, end: partEnd };
  });
}
