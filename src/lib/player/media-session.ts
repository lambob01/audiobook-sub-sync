import { playerState, bookTime, displayTime } from '$lib/stores/player';

export function setupMediaSession() {
  if (!('mediaSession' in navigator)) return () => {};

  function updateMetadata() {
    const state = playerState;
    const s = getState();
    navigator.mediaSession.metadata = new MediaMetadata({
      title: s.itemId ?? 'syncspeak',
      artist: 'Audiobook',
      album: 'syncspeak'
    });
  }

  navigator.mediaSession.setActionHandler('play', () => {
    const audio = document.querySelector('audio');
    if (audio) audio.play();
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    const audio = document.querySelector('audio');
    if (audio) audio.pause();
  });
  navigator.mediaSession.setActionHandler('seekbackward', () => {
    bookTime.update((t) => Math.max(0, t - 10));
  });
  navigator.mediaSession.setActionHandler('seekforward', () => {
    bookTime.update((t) => t + 10);
  });
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    // chapter back
  });
  navigator.mediaSession.setActionHandler('nexttrack', () => {
    // chapter forward
  });

  updateMetadata();
}

import { get } from 'svelte/store';
function getState() {
  return get(playerState);
}
