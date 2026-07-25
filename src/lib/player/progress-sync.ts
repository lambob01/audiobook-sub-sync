import { writable, get } from 'svelte/store';
import { bookTime } from '$lib/stores/player';
import { absOnline, offlineQueue } from '$lib/stores/connection';

interface QueuedSync {
  seq: number;
  time: number;
  listened: number;
}

let sessionId: string | null = null;
let itemId: string | null = null;
let syncTimer: ReturnType<typeof setInterval> | null = null;
let lastSyncedTime = 0;
let lastSentTime = 0;
let totalListened = 0;
let seqNum = 0;
let queue: QueuedSync[] = [];

const STORAGE_KEY = 'syncspeak_progress';

function saveLocal(bookT: number) {
  if (!itemId) return;
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  stored[itemId] = { time: bookT, ts: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function getLocalProgress(id: string): number | null {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  return stored[id]?.time ?? null;
}

function enqueueSync(time: number) {
  const listened = time - lastSentTime;
  if (listened <= 0) return;
  seqNum++;
  queue.push({ seq: seqNum, time, listened });
  offlineQueue.set(queue.length);
}

async function sendSync(time: number) {
  if (!sessionId || !itemId) return;

  const listened = time - lastSentTime;
  if (listened <= 0.5) return;

  lastSentTime = time;

  try {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        currentTime: time,
        timeListened: totalListened + listened,
        duration: 0 // ABS knows duration
      })
    });
    if (res.ok) {
      absOnline.set(true);
      totalListened += listened;
      // discard stale queue entries
      queue = [];
      offlineQueue.set(0);
    }
  } catch {
    absOnline.set(false);
    enqueueSync(time);
  }
}

let retryTimer: ReturnType<typeof setInterval> | null = null;

function startRetry() {
  if (retryTimer) return;
  retryTimer = setInterval(async () => {
    if (queue.length === 0) {
      clearInterval(retryTimer!);
      retryTimer = null;
      return;
    }
    // send most recent entry only (last-write-wins)
    const last = queue[queue.length - 1];
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          currentTime: last.time,
          timeListened: totalListened + last.listened,
          duration: 0
        })
      });
      if (res.ok) {
        absOnline.set(true);
        totalListened += last.listened;
        lastSentTime = last.time;
        queue = [];
        offlineQueue.set(0);
        clearInterval(retryTimer!);
        retryTimer = null;
      }
    } catch {
      // backoff handled by retry interval
    }
  }, 15_000);
}

export function initProgressSync(sid: string, iid: string, initialTime: number) {
  sessionId = sid;
  itemId = iid;
  lastSyncedTime = initialTime;
  lastSentTime = initialTime;

  const unsub = bookTime.subscribe((t) => {
    saveLocal(t);
    if (t - lastSyncedTime >= 15) {
      lastSyncedTime = t;
      sendSync(t);
    }
  });

  syncTimer = setInterval(() => {
    const t = get(bookTime);
    if (t - lastSyncedTime >= 15) {
      lastSyncedTime = t;
      sendSync(t);
    }
  }, 15_000);

  function onPause() { const t = get(bookTime); sendSync(t); }
  function onEnded() { const t = get(bookTime); sendSync(t); }
  function onSeeked() { lastSyncedTime = get(bookTime); }
  function onVisibility() {
    if (document.hidden) saveLocal(get(bookTime));
  }
  function onPageHide() {
    const t = get(bookTime);
    saveLocal(t);
    if (navigator.sendBeacon) {
      const data = JSON.stringify({ sessionId, itemId, currentTime: t, timeListened: 0 });
      navigator.sendBeacon('/api/session', new Blob([data], { type: 'application/json' }));
    }
  }

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);

  return {
    destroy() {
      unsub();
      if (syncTimer) clearInterval(syncTimer);
      if (retryTimer) clearInterval(retryTimer);
    }
  };
}
