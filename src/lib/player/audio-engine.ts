import { get } from 'svelte/store';
import { playerState, bookTime, locateTrack } from '$lib/stores/player';
import type { Track } from '$lib/stores/player';

export function streamUrl(itemId: string, ino: string): string {
  return `/api/stream/${itemId}/${ino}`;
}

export async function seekTo(targetTime: number, audio: HTMLAudioElement, preloadAudio: HTMLAudioElement, onSwap: (track: Track) => string) {
  const state = get(playerState);
  if (!state.tracks.length) return;

  const clamped = Math.max(0, Math.min(targetTime, state.duration));
  const { track, localTime } = locateTrack(state.tracks, clamped);
  const currentTrack = locateTrack(state.tracks, get(bookTime)).track;

  if (track.ino !== currentTrack.ino) {
    const src = onSwap(track);
    audio.src = src;
    audio.load();
    await new Promise((resolve) => {
      const handler = () => { audio.removeEventListener('canplay', handler); resolve(undefined); };
      audio.addEventListener('canplay', handler);
    });
    preloadNext(track, state.tracks, preloadAudio, onSwap);
  }

  audio.currentTime = localTime;
  bookTime.set(clamped);
}

function preloadNext(current: Track, tracks: Track[], preload: HTMLAudioElement, urlFn: (t: Track) => string) {
  const idx = tracks.indexOf(current);
  if (idx < 0 || idx >= tracks.length - 1) return;
  const next = tracks[idx + 1];
  preload.src = urlFn(next);
  preload.load();
}
