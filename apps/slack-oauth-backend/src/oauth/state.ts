import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { config } from '../config';

/**
 * Stateless, signed OAuth state tokens.
 *
 * The token is `nonce.timestamp.signature`, HMAC-SHA256 signed with
 * `config.sessionSecret`, then base64url-encoded with no padding. This works on
 * serverless (no shared store needed): /authorize signs the token and /callback
 * verifies the signature, so a forged or replayed state is rejected without any
 * cross-instance state. base64url (A-Za-z0-9-_) satisfies the callback
 * validator's /^[a-zA-Z0-9_-]+$/ length 16..500 check.
 */

const DEFAULT_MAX_AGE_MS = 10 * 60 * 1000;
const SEPARATOR = '.';

function sign(payload: string): string {
  return createHmac('sha256', config.sessionSecret).update(payload).digest('base64url');
}

/**
 * Build a signed state token from a CSPRNG nonce and the current timestamp.
 */
export function generateState(): string {
  const nonce = randomBytes(16).toString('base64url');
  const timestamp = Date.now().toString();
  const payload = `${nonce}${SEPARATOR}${timestamp}`;
  const signature = sign(payload);
  const token = `${payload}${SEPARATOR}${signature}`;
  return Buffer.from(token, 'utf8').toString('base64url');
}

/**
 * Verify a state token's HMAC signature and freshness. Never throws; returns
 * false on any decode error, signature mismatch, malformed structure, or if the
 * embedded timestamp is older than maxAgeMs.
 */
export function validateState(state: string, maxAgeMs: number = DEFAULT_MAX_AGE_MS): boolean {
  try {
    if (typeof state !== 'string' || state.length === 0) {
      return false;
    }

    const decoded = Buffer.from(state, 'base64url').toString('utf8');
    const parts = decoded.split(SEPARATOR);
    if (parts.length !== 3) {
      return false;
    }

    const [nonce, timestamp, signature] = parts;
    if (!nonce || !timestamp || !signature) {
      return false;
    }

    const expectedSignature = sign(`${nonce}${SEPARATOR}${timestamp}`);
    const provided = Buffer.from(signature, 'utf8');
    const expected = Buffer.from(expectedSignature, 'utf8');
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return false;
    }

    const issuedAt = Number(timestamp);
    if (!Number.isInteger(issuedAt) || issuedAt <= 0) {
      return false;
    }

    const age = Date.now() - issuedAt;
    if (age < 0 || age > maxAgeMs) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
