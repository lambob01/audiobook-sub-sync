const buckets = new Map<string, { tokens: number; last: number }>();
const RATE = 5; // 5 logins per minute per IP
const PERIOD = 60_000;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b || now - b.last > PERIOD) {
    b = { tokens: RATE - 1, last: now };
    buckets.set(ip, b);
    return true;
  }
  const elapsed = now - b.last;
  b.tokens = Math.min(RATE, b.tokens + (elapsed / PERIOD) * RATE) - 1;
  b.last = now;
  buckets.set(ip, b);
  return b.tokens >= 0;
}

// ponytail: in-memory buckets, no cleanup; fine for single-instance personal use
