import { writable, get } from 'svelte/store';

export const sleepTimer = writable<{
  active: boolean;
  minutes: number;
  startedAt: number;
  mode: 'timer' | 'chapter';
} | null>(null);

let timer: ReturnType<typeof setTimeout> | null = null;

export function startSleepTimer(minutes: number, mode: 'timer' | 'chapter', onEnd: () => void) {
  clearSleepTimer();

  sleepTimer.set({
    active: true,
    minutes,
    startedAt: Date.now(),
    mode
  });

  if (mode === 'timer') {
    timer = setTimeout(() => {
      clearSleepTimer();
      onEnd();
    }, minutes * 60_000);
  }
}

export function clearSleepTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  sleepTimer.set(null);
}

export function getRemaining(): number {
  const st = get(sleepTimer);
  if (!st) return 0;
  const elapsed = (Date.now() - st.startedAt) / 60_000;
  return Math.max(0, st.minutes - elapsed);
}
