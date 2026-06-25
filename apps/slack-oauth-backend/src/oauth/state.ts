import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { config } from '../config';

/**
 * Stateless, signed, browser-bound OAuth state tokens.
 *
 * The token is `nonce.timestamp.browserNonce.signature`, HMAC-SHA256 signed
 * with `config.sessionSecret`, then base64url-encoded with no padding. This
 * works on serverless (no shared store needed): /authorize signs the token and
 * /callback verifies the signature, so a forged or replayed state is rejected
 * without any cross-instance state. base64url (A-Za-z0-9-_) satisfies the
 * callback validator's /^[a-zA-Z0-9_-]+$/ length 16..500 check.
 *
 * CSRF hardening (double-submit cookie pattern): the signed token also embeds a
 * per-browser `browserNonce`. /authorize sets that nonce in an HttpOnly cookie
 * AND folds it into the signature; /callback re-reads it from the cookie and
 * requires it to match the signed copy. A signed state alone is therefore
 * useless to an attacker who did not also receive the victim browser's cookie,
 * which proves the browser hitting /callback is the same one that started the
 * flow.
 */

/** Cookie name carrying the per-browser nonce that binds a state token to a browser. */
export const OAUTH_STATE_COOKIE = 'oauth_browser_nonce';

const DEFAULT_MAX_AGE_MS = 10 * 60 * 1000;
const SEPARATOR = '.';

function sign(payload: string): string {
  return createHmac('sha256', config.sessionSecret).update(payload).digest('base64url');
}

/**
 * Constant-time string comparison that never throws and is length-safe.
 * Returns false for unequal lengths without leaking which side differed.
 */
function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * Generate a CSPRNG per-browser nonce. Stored in an HttpOnly cookie by
 * /authorize and bound into the signed state token.
 */
export function generateBrowserNonce(): string {
  return randomBytes(16).toString('base64url');
}

/**
 * Build a signed state token bound to the given per-browser nonce, from a fresh
 * CSPRNG nonce and the current timestamp.
 */
export function generateState(browserNonce: string): string {
  const nonce = randomBytes(16).toString('base64url');
  const timestamp = Date.now().toString();
  const payload = `${nonce}${SEPARATOR}${timestamp}${SEPARATOR}${browserNonce}`;
  const signature = sign(payload);
  const token = `${payload}${SEPARATOR}${signature}`;
  return Buffer.from(token, 'utf8').toString('base64url');
}

/**
 * Verify a state token's HMAC signature, freshness, and browser binding. Never
 * throws; returns false on any decode error, signature mismatch, malformed
 * structure, an expired timestamp, or a `browserNonce` that does not match the
 * one signed into the token (the double-submit cookie check).
 */
export function validateState(
  state: string,
  browserNonce: string,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS
): boolean {
  try {
    if (typeof state !== 'string' || state.length === 0) {
      return false;
    }
    // A missing/empty cookie nonce can never match a signed one; reject early so
    // a stripped cookie cannot bypass the binding.
    if (typeof browserNonce !== 'string' || browserNonce.length === 0) {
      return false;
    }

    const decoded = Buffer.from(state, 'base64url').toString('utf8');
    const parts = decoded.split(SEPARATOR);
    if (parts.length !== 4) {
      return false;
    }

    const [nonce, timestamp, signedBrowserNonce, signature] = parts;
    if (!nonce || !timestamp || !signedBrowserNonce || !signature) {
      return false;
    }

    const expectedSignature = sign(
      `${nonce}${SEPARATOR}${timestamp}${SEPARATOR}${signedBrowserNonce}`
    );
    if (!constantTimeEqual(signature, expectedSignature)) {
      return false;
    }

    // Double-submit cookie check: the nonce presented by the browser cookie must
    // match the one bound into the signed token. Compared in constant time.
    if (!constantTimeEqual(browserNonce, signedBrowserNonce)) {
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
