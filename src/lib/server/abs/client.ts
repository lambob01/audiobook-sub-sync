import type { ABSError } from './types';

const RETRY_CODES = new Set([408, 429, 502, 503, 504]);
const MAX_RETRIES = 3;

export class AbsHttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AbsHttpError';
    this.status = status;
  }
}

export function absClient(absUrl: string, token: string) {
  const base = absUrl.replace(/\/$/, '');

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${base}${path}`;
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url, { ...init, headers });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          if (RETRY_CODES.has(res.status) && attempt < MAX_RETRIES - 1) {
            await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
            continue;
          }
          throw new AbsHttpError(body || `ABS returned ${res.status}`, res.status);
        }
        const text = await res.text();
        return text ? JSON.parse(text) : (undefined as T);
      } catch (err) {
        if (err instanceof AbsHttpError) throw err;
        lastError = err as Error;
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
        }
      }
    }
    throw lastError ?? new AbsHttpError('Unknown error', 0);
  }

  async function stream(path: string, init?: RequestInit) {
    const url = `${base}${path}`;
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...init, headers });
  }

  return { request, stream };
}

export type AbsClient = ReturnType<typeof absClient>;
