import type { AbsClient } from './client';
import type { ABSUser } from './types';

export async function absLogin(
  abs: AbsClient,
  username: string,
  password: string
): Promise<ABSUser> {
  const body = JSON.stringify({ username, password });
  const data = await abs.request<{ user: ABSUser }>('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  return data.user;
}

let authorizeCache: { token: string; valid: boolean; ts: number } | null = null;

export async function absAuthorize(abs: AbsClient, token: string): Promise<boolean> {
  if (authorizeCache?.token === token && Date.now() - authorizeCache.ts < 60_000) {
    return authorizeCache.valid;
  }
  try {
    const data = await abs.request<{ user: ABSUser }>('/api/authorize', { method: 'POST' });
    const valid = !!data.user;
    authorizeCache = { token, valid, ts: Date.now() };
    return valid;
  } catch {
    authorizeCache = { token, valid: false, ts: Date.now() };
    return false;
  }
}
