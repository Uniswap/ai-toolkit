/**
 * Minimal request-cookie reader.
 *
 * Express's `res.cookie()` / `res.clearCookie()` need no middleware to WRITE
 * cookies, but `req.cookies` is only populated by the `cookie-parser`
 * middleware, which this app deliberately does not install. This helper parses
 * the raw `Cookie` request header so we can read a single cookie value without
 * pulling in an extra dependency.
 */

/**
 * Read a single cookie value from a raw `Cookie` header string.
 *
 * Returns the decoded value of the first matching cookie, or `undefined` if the
 * header is absent/empty or the name is not present. Values are
 * `decodeURIComponent`-decoded; a malformed encoding falls back to the raw
 * value rather than throwing.
 */
export function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (typeof cookieHeader !== 'string' || cookieHeader.length === 0) {
    return undefined;
  }

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }
    const key = pair.slice(0, eqIndex).trim();
    if (key !== name) {
      continue;
    }
    const rawValue = pair.slice(eqIndex + 1).trim();
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return undefined;
}
