import type { Cue, Word } from '$lib/types';

export function parseVTT(content: string): { cues: Cue[]; wordLevel: boolean } {
  const raw = content
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const blocks = raw.split(/\n\n+/);
  const cues: Cue[] = [];
  let headerDone = false;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (!headerDone) {
      if (trimmed.startsWith('WEBVTT')) {
        headerDone = true;
        continue;
      }
      continue;
    }

    // skip NOTE blocks
    if (/^NOTE\b/i.test(trimmed)) continue;

    // skip style blocks
    if (trimmed.startsWith('STYLE')) continue;

    const lines = trimmed.split('\n');
    let idx = 0;

    // optional cue identifier
    if (lines[0] && !lines[0].includes('-->') && lines.length > 1) {
      idx = 1;
    }

    const timeLine = lines[idx];
    if (!timeLine?.includes('-->')) continue;

    const timeMatch = timeLine.match(
      /(\d{2,3}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2,3}):(\d{2}):(\d{2})\.(\d{3})/
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

    let text = lines
      .slice(idx + 1)
      .join('\n')
      .replace(/<[^>]+>/g, '')
      .trim();

    if (!text) continue;

    const words = extractWordTimestamps(text);
    if (words.length > 0) {
      cues.push({
        i: cues.length,
        start,
        end,
        text: words.map((w) => w.text).join(' '),
        words
      });
    } else {
      cues.push({
        i: cues.length,
        start,
        end,
        text,
        words: []
      });
    }
  }

  const wordLevel = cues.some((c) => c.words.length > 0);

  return { cues, wordLevel };
}

function extractWordTimestamps(text: string): Word[] {
  const words: Word[] = [];
  const regex = /<(\d{2}):(\d{2}):(\d{2})\.(\d{3})>([^<]*)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const t =
      parseInt(match[1]) * 3600 +
      parseInt(match[2]) * 60 +
      parseInt(match[3]) +
      parseInt(match[4]) / 1000;

    const wordText = match[5].trim();
    if (wordText) {
      words.push({ t, d: 0.3, text: wordText });
    }
  }

  return words;
}
