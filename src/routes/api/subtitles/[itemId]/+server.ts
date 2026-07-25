import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { fetchItem } from '$lib/server/abs/libraries';
import { discoverSubtitles } from '$lib/server/subtitles/discover';
import { parseSRT } from '$lib/server/subtitles/parse-srt';
import { parseVTT } from '$lib/server/subtitles/parse-vtt';
import { splitCues } from '$lib/server/subtitles/split-cues';
import { synthesizeWords } from '$lib/server/subtitles/synthesize';
import { getCache, setCache } from '$lib/server/subtitles/cache';

export const GET: RequestHandler = async ({ locals, params, url }) => {
  if (!locals.abs) throw error(401);

  const ino = url.searchParams.get('ino');

  if (!ino) {
    const item = await fetchItem(locals.abs, params.itemId);
    const candidates = discoverSubtitles(item);
    return json({ candidates });
  }

  const item = await fetchItem(locals.abs, params.itemId);
  const file = item.libraryFiles?.find((f) => f.ino === ino);
  if (!file) throw error(404, 'Subtitle file not found');

  const cacheKey = `${params.itemId}:${ino}:${file.metadata.mtimeMs}`;
  const cached = getCache<object>(cacheKey);
  if (cached) return json(cached);

  const res = await locals.abs.stream(`/api/items/${params.itemId}/file/${ino}`);
  if (!res.ok) throw error(502, 'Failed to fetch subtitle from ABS');

  const raw = await res.text();
  const isVtt = file.metadata.ext === '.vtt' || raw.includes('WEBVTT');

  let cues;
  let wordLevel = false;

  if (isVtt) {
    const result = parseVTT(raw);
    cues = result.cues;
    wordLevel = result.wordLevel;
  } else {
    cues = parseSRT(raw);
  }

  cues = splitCues(cues);
  cues = synthesizeWords(cues);

  if (!wordLevel) {
    wordLevel = cues.some((c) => c.words.length > 0);
  }

  const data = {
    label: file.metadata.filename,
    cues: cues.map((c) => ({
      i: c.i,
      start: c.start,
      end: c.end,
      text: c.text,
      words: c.words.map((w) => ({ t: w.t, d: w.d, text: w.text }))
    })),
    wordLevel
  };

  setCache(cacheKey, data);
  return json(data);
};
