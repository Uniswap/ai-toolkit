import { readCookie } from './cookies';

describe('readCookie', () => {
  it('reads a single cookie value by name', () => {
    expect(readCookie('oauth_browser_nonce=abc123', 'oauth_browser_nonce')).toBe('abc123');
  });

  it('reads the right value from a multi-cookie header', () => {
    const header = 'foo=1; oauth_browser_nonce=abc123; bar=2';
    expect(readCookie(header, 'oauth_browser_nonce')).toBe('abc123');
  });

  it('tolerates surrounding whitespace between cookies', () => {
    expect(readCookie('a=1;   oauth_browser_nonce=xyz', 'oauth_browser_nonce')).toBe('xyz');
  });

  it('URL-decodes the value', () => {
    expect(readCookie('n=a%2Bb%2Fc', 'n')).toBe('a+b/c');
  });

  it('falls back to the raw value on malformed encoding', () => {
    expect(readCookie('n=%E0%A4%A', 'n')).toBe('%E0%A4%A');
  });

  it('returns undefined when the cookie is absent', () => {
    expect(readCookie('foo=1; bar=2', 'oauth_browser_nonce')).toBeUndefined();
  });

  it('returns undefined for an undefined or empty header', () => {
    expect(readCookie(undefined, 'n')).toBeUndefined();
    expect(readCookie('', 'n')).toBeUndefined();
  });

  it('does not match a name that is only a substring of another cookie', () => {
    expect(readCookie('oauth_browser_nonce_extra=zzz', 'oauth_browser_nonce')).toBeUndefined();
  });
});
