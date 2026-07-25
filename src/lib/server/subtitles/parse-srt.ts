import type { Cue, Word } from '$lib/types';

export function parseSRT(content: string): Cue[] {
  const raw = content
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const blocks = raw.split(/\n\n+/);
  const cues: Cue[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n');
    let idx = 0;

    if (/^\d+$/.test(lines[0].trim())) idx = 1;

    const timeMatch = lines[idx]?.match(
      /(\d{2,3}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2,3}):(\d{2}):(\d{2})[,.](\d{3})/
    );
    if (!timeMatch) continue;

    const start =
      parseInt(timeMatch[1]) * 3600 +
      parseInt(timeMatch[2]) * 60 +
      parseInt(timeMatch[3]) +
      parseInt(timeMatch[4]) / 1000;

    const end =
      parseInt(timeMatch[5]) * 3600 +
      parseInt(timeMatch[6]) * 60 +
      parseInt(timeMatch[7]) +
      parseInt(timeMatch[8]) / 1000;

    if (end <= start) continue;

    const text = lines
      .slice(idx + 1)
      .join('\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\{[^}]+\}/g, '')
      .trim();

    if (!text) continue;

    cues.push({
      i: cues.length,
      start,
      end,
      text,
      words: []
    });
  }

  return cues;
}
