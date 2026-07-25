import { writable } from 'svelte/store';

export const absOnline = writable(true);
export const offlineQueue = writable<number>(0);
