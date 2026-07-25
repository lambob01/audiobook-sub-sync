import type { AbsClient } from '$lib/server/abs/client';
import type { ABSItemExpanded } from '$lib/server/abs/types';

export interface SubtitleCandidate {
  ino: string;
  filename: string;
  ext: string;
  mtimeMs: number;
  rank: number;
}

export function discoverSubtitles(item: ABSItemExpanded): SubtitleCandidate[] {
  const files = item.libraryFiles ?? [];
  const subtitleFiles = files.filter(
    (f) => f.metadata.ext === '.srt' || f.metadata.ext === '.vtt'
  );

  const candidates = subtitleFiles.map((f, i) => {
    const base = f.metadata.filename.replace(/\.(srt|vtt)$/i, '');
    let rank = 0;

    // rank by filename similarity to audio tracks
    const tracks = item.media.tracks ?? [];
    for (const track of tracks) {
      const trackBase = track.metadata?.filename?.replace(/\.[^.]+$/, '') ?? '';
      if (base.includes(trackBase) || trackBase.includes(base)) {
        rank += 10;
      }
    }

    rank += subtitleFiles.length - i; // prefer first files

    return {
      ino: f.ino,
      filename: f.metadata.filename,
      ext: f.metadata.ext,
      mtimeMs: f.metadata.mtimeMs,
      rank
    };
  });

  candidates.sort((a, b) => b.rank - a.rank);
  return candidates;
}
