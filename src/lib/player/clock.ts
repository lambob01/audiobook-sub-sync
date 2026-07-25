export function createClock(audio: HTMLAudioElement, onTick: (t: number) => void) {
  let raf = 0;
  let running = false;

  function tick() {
    if (!running) return;
    onTick(audio.currentTime);
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
    onTick(audio.currentTime);
  }

  audio.addEventListener('play', start);
  audio.addEventListener('pause', stop);
  audio.addEventListener('ended', stop);
  audio.addEventListener('seeked', () => onTick(audio.currentTime));
  audio.addEventListener('playing', () => { if (!running) start(); });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) stop();
    else if (!document.hidden && !audio.paused && !running) start();
  });

  return { destroy() { stop(); } };
}
