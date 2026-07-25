import { EncryptJWT, jwtDecrypt } from 'jose';
import { createHash } from 'node:crypto';

export interface SessionData {
  absUrl: string;
  userId: string;
  username: string;
  token: string;
  tokenVersion: number;
}

let _secret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (_secret) return _secret;
  const raw = process.env.SESSION_SECRET;
  if (!raw) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  if (raw.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }
  _secret = new Uint8Array(createHash('sha256').update(raw).digest());
  return _secret;
}

export async function seal(data: SessionData): Promise<string> {
  return new EncryptJWT({ ...data })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .encrypt(getSecret());
}

export async function unseal(jwt: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtDecrypt(jwt, getSecret());
    return payload as unknown as SessionData;
  } catch {
    return null;
  }
}
