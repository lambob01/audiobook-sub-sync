import type { SubtitleTrack, Cue } from '$lib/types';

export function normalize(
  cues: Cue[],
  source: 'abs' | 'upload',
  label: string,
  offsetMs: number,
  wordLevel: boolean
): SubtitleTrack {
  const starts = new Float64Array(cues.length);
  for (let i = 0; i < cues.length; i++) {
    starts[i] = cues[i].start;
  }

  return {
    id: `${source}:${label}`,
    source,
    label,
    offsetMs,
    cues,
    starts,
    wordLevel
  };
}
