import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface SubtitlePrefs {
  fontSize: number;
  lineHeight: number;
  activeWeight: number;
  wordGap: number;
}

const defaults: SubtitlePrefs = {
  fontSize: 16,
  lineHeight: 1.6,
  activeWeight: 600,
  wordGap: 0.25
};

function load(): SubtitlePrefs {
  if (!browser) return defaults;
  try {
    const stored = localStorage.getItem('syncspeak_subtitle_prefs');
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch {
    return defaults;
  }
}

export const subtitlePrefs = writable<SubtitlePrefs>(load());

subtitlePrefs.subscribe((prefs) => {
  if (browser) {
    localStorage.setItem('syncspeak_subtitle_prefs', JSON.stringify(prefs));
  }
});
