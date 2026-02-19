import { cookies } from 'next/headers';
import crypto from 'node:crypto';

export interface Session {
  userId: string;
  login: string;
  avatarUrl: string;
  accessToken: string;
}

const SESSION_COOKIE = 'review_dashboard_session';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getSessionSecret(): Buffer {
  const secret = process.env['SESSION_SECRET'];
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET environment variable must be at least 32 characters');
  }
  // Derive a 32-byte key from the secret
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptSession(session: Session): string {
  const key = getSessionSecret();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(session);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: base64(iv + authTag + ciphertext)
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64url');
}

export function decryptSession(cookie: string): Session | null {
  try {
    const key = getSessionSecret();
    const combined = Buffer.from(cookie, 'base64url');

    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      return null;
    }

    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return JSON.parse(decrypted.toString('utf8')) as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie?.value) {
    return null;
  }
  return decryptSession(sessionCookie.value);
}

export async function setSession(session: Session): Promise<void> {
  const cookieStore = await cookies();
  const encrypted = encryptSession(session);
  cookieStore.set(SESSION_COOKIE, encrypted, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
