import type { Cue, Word } from './types';

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
    const words: Word[] = tokens.map((text, idx) => {
      const d = (weights[idx] / total) * span + PER_WORD;
      const w = { t, d, text };
      t += d;
      return w;
    });

    return { ...cue, words };
  });
}

export function splitCues(cues: Cue[], maxDuration = 6): Cue[] {
  const result: Cue[] = [];

  for (const cue of cues) {
    const duration = cue.end - cue.start;
    if (duration <= maxDuration) {
      result.push({ ...cue, words: [] });
      continue;
    }

    const sentences = cue.text.split(/(?<=[.!?])\s+/);
    if (sentences.length <= 1) {
      result.push({ ...cue, words: [] });
      continue;
    }

    const totalChars = cue.text.length;
    const cueDuration = cue.end - cue.start;

    let offset = 0;
    for (const part of sentences) {
      const ratio = part.length / totalChars;
      const partDuration = ratio * cueDuration;
      result.push({
        i: result.length,
        start: cue.start + offset,
        end: cue.start + offset + partDuration,
        text: part.trim(),
        words: []
      });
      offset += partDuration;
    }
  }

  return result;
}

export function parseSubtitleText(raw: string, filename: string): Cue[] {
  const isVtt = filename.endsWith('.vtt') || raw.includes('WEBVTT');
  const cues = isVtt ? parseVTT(raw) : parseSRT(raw);
  return synthesizeWords(splitCues(cues));
}

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

    cues.push({ i: cues.length, start, end, text, words: [] });
  }

  return cues;
}

function parseVTT(content: string): Cue[] {
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
      if (trimmed.startsWith('WEBVTT')) { headerDone = true; continue; }
      continue;
    }

    if (/^NOTE\b/i.test(trimmed)) continue;
    if (trimmed.startsWith('STYLE')) continue;

    const lines = trimmed.split('\n');
    let idx = 0;

    if (lines[0] && !lines[0].includes('-->') && lines.length > 1) idx = 1;

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

    cues.push({ i: cues.length, start, end, text, words: [] });
  }

  return cues;
}
