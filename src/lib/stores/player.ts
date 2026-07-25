import { writable } from 'svelte/store';

export interface Track {
  ino: string;
  startOffset: number;
  duration: number;
  mimeType: string;
  title?: string;
}

export interface Chapter {
  id: number;
  start: number;
  end: number;
  title: string;
}

export interface PlayerState {
  itemId: string | null;
  sessionId: string | null;
  tracks: Track[];
  chapters: Chapter[];
  duration: number;
  playing: boolean;
  rate: number;
  volume: number;
  buffering: boolean;
}

const initial: PlayerState = {
  itemId: null,
  sessionId: null,
  tracks: [],
  chapters: [],
  duration: 0,
  playing: false,
  rate: 1,
  volume: 1,
  buffering: false
};

export const playerState = writable<PlayerState>(initial);

export function locateTrack(tracks: Track[], bookTime: number): { track: Track; localTime: number } {
  const t = tracks.findLast((x) => bookTime >= x.startOffset) ?? tracks[0];
  return { track: t, localTime: bookTime - t.startOffset };
}

export const bookTime = writable(0);
export const displayTime = writable(0);

let lastDisplayUpdate = 0;
bookTime.subscribe((t) => {
  const now = Date.now();
  if (now - lastDisplayUpdate >= 100) {
    lastDisplayUpdate = now;
    displayTime.set(t);
  }
});
