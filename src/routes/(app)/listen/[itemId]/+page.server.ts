import type { PageServerLoad } from './$types';
import { fetchItem, openPlaySession } from '$lib/server/abs/libraries';
import { setCachedSession } from '$lib/server/abs/sessions';
import { discoverSubtitles } from '$lib/server/subtitles/discover';
import { parseSRT } from '$lib/server/subtitles/parse-srt';
import { parseVTT } from '$lib/server/subtitles/parse-vtt';
import { splitCues } from '$lib/server/subtitles/split-cues';
import { synthesizeWords } from '$lib/server/subtitles/synthesize';
import { getCache, setCache } from '$lib/server/subtitles/cache';
import { getPref } from '$lib/server/store/db';
import { error } from '@sveltejs/kit';

interface SubtitleData {
  label: string;
  cues: Array<{
    i: number; start: number; end: number; text: string;
    words: Array<{ t: number; d: number; text: string }>;
  }>;
  wordLevel: boolean;
}

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.abs || !locals.session) throw error(401);

  const [item, session] = await Promise.all([
    fetchItem(locals.abs, params.itemId),
    openPlaySession(locals.abs, params.itemId)
  ]);

  const tracks = session.audioTracks.map((t, i) => ({
    index: i,
    ino: String(i),
    contentUrl: t.contentUrl,
    startOffset: t.startOffset,
    duration: t.duration,
    mimeType: t.mimeType,
    title: t.title
  }));

  setCachedSession(`${locals.session.userId}:${params.itemId}`, {
    itemId: params.itemId,
    tracks: tracks.map((t) => ({ contentUrl: t.contentUrl, ino: String(t.index) }))
  });

  const candidates = discoverSubtitles(item);
  const savedOffset = Number(getPref(locals.session.userId, `offset:${params.itemId}`) ?? 0);

  let subtitleData: SubtitleData | null = null;
  if (candidates.length > 0) {
    const best = candidates[0];
    const cacheKey = `${params.itemId}:${best.ino}:${best.mtimeMs}`;
    const cached = getCache<SubtitleData>(cacheKey);

    if (cached) {
      subtitleData = cached;
    } else {
      try {
        const res = await locals.abs.stream(`/api/items/${params.itemId}/file/${best.ino}`);
        if (res.ok) {
          const raw = await res.text();
          const isVtt = best.ext === '.vtt' || raw.includes('WEBVTT');
          let cues = isVtt ? parseVTT(raw).cues : parseSRT(raw);
          cues = splitCues(cues);
          cues = synthesizeWords(cues);
          const wordLevel = cues.some((c) => c.words.length > 0);

          subtitleData = {
            label: best.filename,
            cues: cues.map((c) => ({
              i: c.i, start: c.start, end: c.end, text: c.text,
              words: c.words.map((w) => ({ t: w.t, d: w.d, text: w.text }))
            })),
            wordLevel
          };
          setCache(cacheKey, subtitleData);
        }
      } catch {
        // subtitle fetch failed, continue without
      }
    }
  }

  return {
    item: {
      id: item.id,
      title: item.media.metadata.title,
      author: item.media.metadata.authorName,
      coverPath: item.media.coverPath
    },
    session: {
      id: session.id,
      currentTime: session.currentTime,
      duration: session.duration,
      audioTracks: tracks,
      chapters: session.chapters.map((c) => ({
        id: c.id, start: c.start, end: c.end, title: c.title
      }))
    },
    subtitle: subtitleData ? {
      label: subtitleData.label,
      cues: subtitleData.cues,
      wordLevel: subtitleData.wordLevel,
      candidates: candidates as Array<{ ino: string; filename: string; rank: number }>,
      offsetMs: savedOffset
    } : null
  };
};
