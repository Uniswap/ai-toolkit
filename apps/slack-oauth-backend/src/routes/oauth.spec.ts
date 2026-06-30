import request from 'supertest';
import express from 'express';

// Deterministic config so the real signed-state lib (not mocked) produces
// verifiable tokens, and so cookies are not marked Secure under test.
jest.mock('../config', () => ({
  config: {
    sessionSecret: 'test-session-secret-deterministic',
    slackClientId: 'test-client-id',
    slackClientSecret: 'test-client-secret',
    slackRedirectUri: 'https://example.com/slack/oauth/callback',
    // formatErrorPage / formatSuccessPage read config.notionDocUrl; omitting it
    // makes escapeHtml(undefined) throw and surfaces as a 500.
    notionDocUrl: 'https://notion.so/setup-docs',
    nodeEnv: 'test',
  },
}));

// Silence logging.
jest.mock('../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
}));

// Avoid real Slack DM delivery on the success path.
const mockSendDirectMessage = jest.fn().mockResolvedValue({ ok: true });
jest.mock('../slack/client', () => ({
  createSlackClient: jest.fn(() => ({
    sendDirectMessage: mockSendDirectMessage,
  })),
}));

// Mock only the rate limiter so repeated supertest requests from the same IP
// don't trip express-rate-limit; keep the validation middleware real so the
// route is exercised end-to-end.
import type * as SecurityMiddleware from '../middleware/security';
jest.mock('../middleware/security', () => {
  const actual = jest.requireActual('../middleware/security') as typeof SecurityMiddleware;
  return {
    ...actual,
    oauthRateLimiter: (_req: any, _res: any, next: any) => next(),
  };
});

// Mock the Slack Web API used by the OAuth handler's code exchange.
import { WebClient } from '@slack/web-api';
jest.mock('@slack/web-api');

const COOKIE_NAME = 'oauth_browser_nonce';

const tokenExchangeResponse = {
  ok: true,
  access_token: 'xoxb-bot-token',
  token_type: 'bot',
  scope: 'chat:write,users:read',
  team: { id: 'T123456', name: 'Test Team' },
  authed_user: {
    id: 'U123456',
    scope: 'chat:write',
    access_token: 'xoxp-user-token',
    token_type: 'user',
  },
  bot_user_id: 'B123456',
};

const userInfoResponse = {
  ok: true,
  user: { id: 'U123456', name: 'testuser', team_id: 'T123456' },
};

function createTestApp(): express.Application {
  const app = express();
  // DISABLE_SECURITY-style minimal app: just the router under test.
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const freshRouter = require('./oauth').default;
    app.use('/slack/oauth', freshRouter);
  });
  // Surface any next(error) as a response instead of an opaque framework 500,
  // so a real failure is visible in the assertion rather than masked.
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(err.status || 500).json({ error: err.message });
  });
  return app;
}

/** Pull a named cookie's value out of a `set-cookie` header array. */
function getSetCookie(setCookie: string[] | undefined, name: string): string | undefined {
  if (!setCookie) {
    return undefined;
  }
  const entry = setCookie.find((c) => c.startsWith(`${name}=`));
  if (!entry) {
    return undefined;
  }
  const valueAndAttrs = entry.slice(name.length + 1);
  return valueAndAttrs.split(';')[0];
}

function getSetCookieRaw(setCookie: string[] | undefined, name: string): string | undefined {
  return setCookie?.find((c) => c.startsWith(`${name}=`));
}

describe('OAuth routes — browser-bound state (double-submit cookie)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendDirectMessage.mockResolvedValue({ ok: true });

    (WebClient as jest.MockedClass<typeof WebClient>).mockImplementation(
      () =>
        ({
          oauth: { v2: { access: jest.fn().mockResolvedValue(tokenExchangeResponse) } },
          users: { info: jest.fn().mockResolvedValue(userInfoResponse) },
        } as any)
    );
  });

  describe('GET /authorize', () => {
    it('redirects to Slack and sets an HttpOnly, SameSite=Lax browser-nonce cookie', async () => {
      const app = createTestApp();
      const res = await request(app).get('/slack/oauth/authorize').expect(302);

      expect(res.headers['location']).toContain('https://slack.com/oauth/v2/authorize');

      const rawCookie = getSetCookieRaw(
        res.headers['set-cookie'] as unknown as string[],
        COOKIE_NAME
      );
      expect(rawCookie).toBeDefined();
      expect(rawCookie).toMatch(/HttpOnly/i);
      expect(rawCookie).toMatch(/SameSite=Lax/i);
      // Under nodeEnv=test the cookie must NOT be Secure (so local HTTP works).
      expect(rawCookie).not.toMatch(/Secure/i);

      const nonce = getSetCookie(res.headers['set-cookie'] as unknown as string[], COOKIE_NAME);
      expect(nonce).toBeTruthy();
    });
  });

  describe('GET /callback', () => {
    // Drive a real /authorize first to obtain a genuinely-signed state plus the
    // matching browser-nonce cookie, then replay them against /callback.
    async function startFlow(app: express.Application) {
      const res = await request(app).get('/slack/oauth/authorize').expect(302);
      const setCookie = res.headers['set-cookie'] as unknown as string[];
      const nonce = getSetCookie(setCookie, COOKIE_NAME) as string;
      const location = res.headers['location'] as string;
      const state = new URL(location).searchParams.get('state') as string;
      return { nonce, state };
    }

    it('succeeds when the cookie nonce matches the signed state, and clears the cookie (one-time use)', async () => {
      const app = createTestApp();
      const { nonce, state } = await startFlow(app);

      const res = await request(app)
        .get('/slack/oauth/callback')
        .query({ code: 'valid-auth-code', state })
        .set('Cookie', `${COOKIE_NAME}=${nonce}`)
        .expect(200);

      // Success page rendered (not the error page).
      expect(res.text).not.toContain('state_mismatch');

      // Cookie is cleared on callback (one-time use): an expired Set-Cookie.
      const cleared = getSetCookieRaw(
        res.headers['set-cookie'] as unknown as string[],
        COOKIE_NAME
      );
      expect(cleared).toBeDefined();
      expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/i);
    });

    it('rejects a valid signed state replayed with a DIFFERENT browser cookie (CSRF)', async () => {
      const app = createTestApp();
      const { state } = await startFlow(app);

      // Attacker has a genuine state but not the victim's cookie nonce.
      const res = await request(app)
        .get('/slack/oauth/callback')
        .query({ code: 'valid-auth-code', state })
        .set('Cookie', `${COOKIE_NAME}=attacker-controlled-nonce`)
        .expect(400);

      // The state_mismatch code renders the friendly error page.
      expect(res.text).toContain('Authorization Failed');
      expect(res.text).toContain('Security validation failed.');
      // The code must never be exchanged when the binding check fails.
      expect(mockSendDirectMessage).not.toHaveBeenCalled();
    });

    it('rejects a valid signed state replayed with NO cookie at all', async () => {
      const app = createTestApp();
      const { state } = await startFlow(app);

      const res = await request(app)
        .get('/slack/oauth/callback')
        .query({ code: 'valid-auth-code', state })
        .expect(400);

      // The state_mismatch code renders the friendly error page.
      expect(res.text).toContain('Authorization Failed');
      expect(res.text).toContain('Security validation failed.');
      expect(mockSendDirectMessage).not.toHaveBeenCalled();
    });

    it('renders BOTH access and refresh tokens on the success page when the DM fails', async () => {
      const app = createTestApp();

      // Rotation-enabled user token comes back with a refresh token.
      (WebClient as jest.MockedClass<typeof WebClient>).mockImplementation(
        () =>
          ({
            oauth: {
              v2: {
                access: jest.fn().mockResolvedValue({
                  ...tokenExchangeResponse,
                  authed_user: {
                    ...tokenExchangeResponse.authed_user,
                    refresh_token: 'xoxe-user-refresh-token',
                  },
                }),
              },
            },
            users: { info: jest.fn().mockResolvedValue(userInfoResponse) },
          } as any)
      );
      // DM delivery fails -> the page is the fallback and must carry both tokens,
      // or the user has no way to obtain their refresh token (the Jun 2026 regression).
      mockSendDirectMessage.mockRejectedValue(new Error('channel_not_found'));

      const { nonce, state } = await startFlow(app);
      const res = await request(app)
        .get('/slack/oauth/callback')
        .query({ code: 'valid-auth-code', state })
        .set('Cookie', `${COOKIE_NAME}=${nonce}`)
        .expect(200);

      expect(res.text).toContain('xoxp-user-token'); // access token
      expect(res.text).toContain('xoxe-user-refresh-token'); // refresh token (regression guard)
      expect(res.text).toContain('Refresh Token');
    });

    it('still sends the DM via authed_user.id when users.info enrichment fails', async () => {
      const app = createTestApp();

      // Enrichment fails (users.info throws) -> handler returns user: undefined,
      // but userId (authed_user.id) is still populated. DM must NOT be skipped.
      (WebClient as jest.MockedClass<typeof WebClient>).mockImplementation(
        () =>
          ({
            oauth: { v2: { access: jest.fn().mockResolvedValue(tokenExchangeResponse) } },
            users: { info: jest.fn().mockRejectedValue(new Error('missing_scope')) },
          } as any)
      );
      mockSendDirectMessage.mockResolvedValue({ ok: true });

      const { nonce, state } = await startFlow(app);
      await request(app)
        .get('/slack/oauth/callback')
        .query({ code: 'valid-auth-code', state })
        .set('Cookie', `${COOKIE_NAME}=${nonce}`)
        .expect(200);

      expect(mockSendDirectMessage).toHaveBeenCalledTimes(1);
      expect(mockSendDirectMessage).toHaveBeenCalledWith(
        'U123456',
        expect.any(String),
        expect.anything()
      );
    });
  });
});
