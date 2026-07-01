// Mock the config module with a deterministic session secret
jest.mock('../config', () => ({
  config: {
    sessionSecret: 'test-session-secret-deterministic',
  },
}));

import { generateState, validateState, generateBrowserNonce } from './state';

describe('OAuth State Token', () => {
  describe('generateBrowserNonce', () => {
    it('should produce a base64url nonce with no padding or unsafe chars', () => {
      const nonce = generateBrowserNonce();
      expect(nonce).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(nonce).not.toContain('=');
    });

    it('should produce a different nonce on each call', () => {
      expect(generateBrowserNonce()).not.toEqual(generateBrowserNonce());
    });
  });

  describe('generateState', () => {
    it('should produce a base64url token with no padding or unsafe chars', () => {
      const state = generateState(generateBrowserNonce());
      expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(state).not.toContain('=');
    });

    it('should stay well under the 500-char callback limit', () => {
      const state = generateState(generateBrowserNonce());
      expect(state.length).toBeGreaterThanOrEqual(16);
      expect(state.length).toBeLessThan(500);
    });

    it('should produce a different token on each call even with the same browser nonce', () => {
      const browserNonce = generateBrowserNonce();
      expect(generateState(browserNonce)).not.toEqual(generateState(browserNonce));
    });
  });

  describe('validateState', () => {
    it('should validate a freshly generated state with the matching browser nonce', () => {
      const browserNonce = generateBrowserNonce();
      const state = generateState(browserNonce);
      expect(validateState(state, browserNonce)).toBe(true);
    });

    it('should reject a valid state presented with a different browser nonce (CSRF)', () => {
      const browserNonce = generateBrowserNonce();
      const state = generateState(browserNonce);
      const attackerNonce = generateBrowserNonce();
      expect(attackerNonce).not.toEqual(browserNonce);
      // The signed state is genuine, but the browser cookie nonce does not match
      // the one bound into the token, so the double-submit check rejects it.
      expect(validateState(state, attackerNonce)).toBe(false);
    });

    it('should reject when the browser nonce is missing/empty', () => {
      const browserNonce = generateBrowserNonce();
      const state = generateState(browserNonce);
      expect(validateState(state, '')).toBe(false);
      // @ts-expect-error exercising the runtime guard for a non-string nonce
      expect(validateState(state, undefined)).toBe(false);
    });

    it('should reject an arbitrary 16+ char string', () => {
      expect(validateState('aaaaaaaaaaaaaaaa', generateBrowserNonce())).toBe(false);
    });

    it('should reject a tampered token (flipped char)', () => {
      const browserNonce = generateBrowserNonce();
      const state = generateState(browserNonce);
      const idx = Math.floor(state.length / 2);
      const original = state[idx];
      const replacement = original === 'A' ? 'B' : 'A';
      const tampered = state.slice(0, idx) + replacement + state.slice(idx + 1);
      expect(validateState(tampered, browserNonce)).toBe(false);
    });

    it('should reject an expired token via a tiny maxAgeMs', async () => {
      const browserNonce = generateBrowserNonce();
      const state = generateState(browserNonce);
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(validateState(state, browserNonce, 1)).toBe(false);
    });

    it('should reject an empty string', () => {
      expect(validateState('', generateBrowserNonce())).toBe(false);
    });

    it('should reject malformed base64url that does not decode to 4 parts', () => {
      const malformed = Buffer.from('not-four-parts', 'utf8').toString('base64url');
      expect(validateState(malformed, generateBrowserNonce())).toBe(false);
    });

    it('should reject a token whose signed browser nonce was swapped (forgery)', () => {
      // A token forged by signing with a different secret cannot pass: build a
      // structurally valid 4-part token under a wrong secret and confirm the
      // signature check rejects it even when the browser nonce matches.
      const browserNonce = generateBrowserNonce();
      const decoyPayload = `nonce.${Date.now()}.${browserNonce}`;
      const decoyToken = Buffer.from(`${decoyPayload}.not-a-valid-signature`, 'utf8').toString(
        'base64url'
      );
      expect(validateState(decoyToken, browserNonce)).toBe(false);
    });
  });
});
