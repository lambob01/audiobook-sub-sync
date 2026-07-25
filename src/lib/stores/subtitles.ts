import { writable } from 'svelte/store';
import type { SubtitleTrack } from '$lib/types';

export const subtitleTrack = writable<SubtitleTrack | null>(null);
export const activeCueIndex = writable(-1);
