import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { createOAuthHandler } from '../oauth/handler';
import {
  generateState,
  validateState,
  generateBrowserNonce,
  OAUTH_STATE_COOKIE,
} from '../oauth/state';
import { createSlackClient } from '../slack/client';
import { formatTokenMessage, formatSuccessPage, formatErrorPage } from '../messages/formatter';
import { logger } from '../utils/logger';
import { readCookie } from '../utils/cookies';
import { config } from '../config';
import { OAuthError, ValidationError } from '../utils/errors';
import type { OAuthCallbackParams } from '../oauth/types';
import {
  oauthRateLimiter,
  validateOAuthCallback,
  validateOAuthAuthorize,
} from '../middleware/security';

const router = Router();

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

/**
 * Cookie options for the per-browser nonce that binds a state token to the
 * browser that started the flow (double-submit cookie CSRF defense).
 *
 * - HttpOnly: not readable by page JS, so XSS cannot exfiltrate it.
 * - SameSite=Lax: still sent on the top-level GET redirect back from Slack.
 * - Secure: only in non-dev/test, mirroring the HTTPS enforcement in
 *   middleware/security.ts so local HTTP testing still works.
 * - path scoped to /slack/oauth: the cookie is only attached on OAuth routes.
 *
 * The same options (minus maxAge) must be passed to clearCookie for the browser
 * to actually drop the cookie on /callback.
 */
const browserNonceCookieBaseOptions = {
  httpOnly: true,
  secure: config.nodeEnv !== 'development' && config.nodeEnv !== 'test',
  sameSite: 'lax' as const,
  path: '/slack/oauth',
};

/**
 * OAuth callback endpoint
 * GET /slack/oauth/callback
 */
router.get(
  '/callback',
  oauthRateLimiter,
  validateOAuthCallback,
  async (req: Request, res: Response, next: NextFunction) => {
    const requestLogger = logger.child({ requestId: (req as any).id });

    try {
      requestLogger.info('OAuth callback received', {
        hasCode: !!req.query.code,
        hasState: !!req.query.state,
        hasError: !!req.query.error,
      });

      // Extract OAuth parameters
      const params: OAuthCallbackParams = {
        code: req.query.code as string | undefined,
        state: req.query.state as string | undefined,
        error: req.query.error as string | undefined,
        error_description: req.query.error_description as string | undefined,
      };

      // Check for OAuth errors from Slack
      if (params.error) {
        throw new OAuthError(
          params.error_description || `OAuth authorization failed: ${params.error}`,
          'INVALID_CODE',
          { error: params.error }
        );
      }

      // Validate required parameters
      if (!params.code) {
        throw new ValidationError('Missing authorization code', 'code');
      }

      // Read the per-browser nonce set by /authorize. Clearing it now (before
      // any branch returns) enforces one-time use: a leaked state is useless on
      // a second callback because the cookie is already gone.
      const browserNonce = readCookie(req.headers.cookie, OAUTH_STATE_COOKIE);
      res.clearCookie(OAUTH_STATE_COOKIE, browserNonceCookieBaseOptions);

      // Create OAuth handler with signed-state validation (CSRF protection).
      // The signed state must verify AND be bound to this browser's nonce
      // (double-submit cookie), proving the callback browser is the one that
      // started the flow.
      const oauthHandler = createOAuthHandler((state) => {
        return (
          typeof state === 'string' &&
          typeof browserNonce === 'string' &&
          validateState(state, browserNonce, STATE_MAX_AGE_MS)
        );
      });

      // Handle OAuth callback
      const result = await oauthHandler.handleCallback(params);

      if (!result.success) {
        requestLogger.warn('OAuth flow failed', {
          error: result.error,
          errorCode: result.errorCode,
        });

        // Send error page
        const errorPage = formatErrorPage(result.errorCode || 'unknown', result.error);

        res.set({
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          Pragma: 'no-cache',
          Expires: '0',
        });
        res.status(400).send(errorPage);
        return;
      }

      requestLogger.info('OAuth flow successful', {
        userId: result.user?.id,
        teamId: result.user?.team_id,
      });

      // Send token via Slack DM
      let dmSent = false;
      try {
        if (result.user?.id && result.accessToken) {
          // Authenticate the DM with the bot token freshly issued by this
          // exchange (not a static env var, which dies under token rotation).
          const slackClient = createSlackClient(undefined, result.botAccessToken);
          const tokenMessage = formatTokenMessage(
            result.accessToken,
            result.user.name,
            result.refreshToken
          );

          await slackClient.sendDirectMessage(
            result.user.id,
            tokenMessage.text,
            tokenMessage.blocks
          );

          requestLogger.info('Token sent via DM', {
            userId: result.user.id,
          });
          dmSent = true;
        }
      } catch (dmError) {
        // Log error but don't fail the flow
        requestLogger.error('Failed to send token via DM', dmError, {
          userId: result.user?.id,
        });
        dmSent = false;
      }

      // Send success page with token displayed if DM failed
      // Generate refresh URL based on request host
      const refreshUrl = `${req.protocol}://${req.get('host')}/slack/refresh`;
      // Never render the refresh token in HTML; the page can be cached by
      // intermediaries. The access-token fallback display is the accepted
      // compromise so the user can still copy a token if the DM failed.
      const successPage = formatSuccessPage(
        result.user?.name,
        dmSent ? undefined : result.accessToken,
        undefined,
        dmSent ? undefined : refreshUrl
      );
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
        Expires: '0',
      });
      res.send(successPage);
    } catch (error) {
      requestLogger.error('OAuth callback error', error);

      // If it's an OAuthError or ValidationError, handle it specially
      if (error instanceof OAuthError || error instanceof ValidationError) {
        const errorPage = formatErrorPage(
          error instanceof OAuthError ? (error.code as any) : 'unknown',
          error.message
        );

        res.set({
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          Pragma: 'no-cache',
          Expires: '0',
        });
        res.status(400).send(errorPage);
        return;
      }

      // Pass other errors to error handler
      next(error);
    }
  }
);

/**
 * Generate OAuth URL endpoint (optional, for testing)
 * GET /slack/oauth/authorize
 */
router.get(
  '/authorize',
  oauthRateLimiter,
  validateOAuthAuthorize,
  (_req: Request, res: Response) => {
    // Bind this OAuth flow to the initiating browser: mint a per-browser nonce,
    // sign it into the state token, AND set it in an HttpOnly cookie. /callback
    // requires the cookie nonce to match the signed one (double-submit cookie),
    // so a state minted here is useless to anyone who lacks this browser's
    // cookie.
    const browserNonce = generateBrowserNonce();
    res.cookie(OAUTH_STATE_COOKIE, browserNonce, {
      ...browserNonceCookieBaseOptions,
      maxAge: STATE_MAX_AGE_MS,
    });

    const state = generateState(browserNonce);
    const oauthHandler = createOAuthHandler();
    const authUrl = oauthHandler.generateAuthUrl(state);

    // In production, store state in session or database
    // For now, just redirect
    res.redirect(authUrl);
  }
);

export default router;
