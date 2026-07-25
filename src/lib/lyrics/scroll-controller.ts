import { get } from 'svelte/store';
import { userScrolling, showJumpPill } from '$lib/stores/ui';

export function createScrollController(
  container: HTMLElement,
  getPlaybackRate: () => number
) {
  let ignoreScrollUntil = 0;
  let suppressUntil = 0;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let userScroll = false;

  function resetIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (get(userScrolling)) {
        userScrolling.set(false);
        showJumpPill.set(false);
      }
    }, 5000);
  }

  function onUserIntent() {
    if (Date.now() < ignoreScrollUntil) return;
    userScroll = true;
    userScrolling.set(true);
    showJumpPill.set(true);
    resetIdle();
  }

  container.addEventListener('wheel', onUserIntent, { passive: true });
  container.addEventListener('touchmove', onUserIntent, { passive: true });

  return {
    scrollToLine(lineEl: HTMLElement, instant = false) {
      if (Date.now() < suppressUntil) return;
      if (userScroll) return;

      const containerRect = container.getBoundingClientRect();
      const lineRect = lineEl.getBoundingClientRect();
      const targetY = lineRect.top - containerRect.top + container.scrollTop - containerRect.height * 0.4;
      const delta = Math.abs(container.scrollTop - targetY);

      if (delta < 8) return;

      ignoreScrollUntil = Date.now() + 350;

      container.scrollTo({
        top: targetY,
        behavior: instant ? 'auto' : 'smooth'
      });

      // ponytail: animation duration scaled inversely with rate if smooth scrolling
    },

    suppressOnSeek() {
      suppressUntil = Date.now() + 400;
    },

    jumpToCurrent() {
      userScroll = false;
      userScrolling.set(false);
      showJumpPill.set(false);
    },

    ignoreNext(duration = 350) {
      ignoreScrollUntil = Date.now() + duration;
    },

    destroy() {
      container.removeEventListener('wheel', onUserIntent);
      container.removeEventListener('touchmove', onUserIntent);
      if (idleTimer) clearTimeout(idleTimer);
    }
  };
}
