// Mock the config module with a deterministic session secret
jest.mock('../config', () => ({
  config: {
    sessionSecret: 'test-session-secret-deterministic',
  },
}));

import { generateState, validateState } from './state';

describe('OAuth State Token', () => {
  describe('generateState', () => {
    it('should produce a base64url token with no padding or unsafe chars', () => {
      const state = generateState();
      expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(state).not.toContain('=');
    });

    it('should stay well under the 500-char callback limit', () => {
      const state = generateState();
      expect(state.length).toBeGreaterThanOrEqual(16);
      expect(state.length).toBeLessThan(500);
    });

    it('should produce a different token on each call', () => {
      expect(generateState()).not.toEqual(generateState());
    });
  });

  describe('validateState', () => {
    it('should validate a freshly generated state', () => {
      const state = generateState();
      expect(validateState(state)).toBe(true);
    });

    it('should reject an arbitrary 16+ char string', () => {
      expect(validateState('aaaaaaaaaaaaaaaa')).toBe(false);
    });

    it('should reject a tampered token (flipped char)', () => {
      const state = generateState();
      const idx = Math.floor(state.length / 2);
      const original = state[idx];
      const replacement = original === 'A' ? 'B' : 'A';
      const tampered = state.slice(0, idx) + replacement + state.slice(idx + 1);
      expect(validateState(tampered)).toBe(false);
    });

    it('should reject an expired token via a tiny maxAgeMs', async () => {
      const state = generateState();
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(validateState(state, 1)).toBe(false);
    });

    it('should reject an empty string', () => {
      expect(validateState('')).toBe(false);
    });

    it('should reject malformed base64url that does not decode to 3 parts', () => {
      const malformed = Buffer.from('not-three-parts', 'utf8').toString('base64url');
      expect(validateState(malformed)).toBe(false);
    });
  });
});
