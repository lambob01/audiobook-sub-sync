import type { SubtitleTrack } from '$lib/types';

export function makeLocator(track: SubtitleTrack) {
  let last = 0;

  return (t: number): number => {
    const s = track.starts;
    const n = s.length;

    if (n === 0) return -1;
    if (last < n && t >= s[last] && (last + 1 >= n || t < s[last + 1])) return last;
    if (last + 1 < n && t >= s[last + 1] && (last + 2 >= n || t < s[last + 2])) return ++last;

    let lo = 0;
    let hi = n - 1;
    let res = 0;

    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (s[m] <= t) {
        res = m;
        lo = m + 1;
      } else {
        hi = m - 1;
      }
    }

    last = res;
    return res;
  };
}
