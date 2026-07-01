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
        userId: result.userId,
        teamId: result.user?.team_id,
      });

      // Send token via Slack DM. Target the authed user's ID from the exchange
      // (result.userId), NOT the users.info enrichment (result.user): enrichment
      // can fail independently, and gating delivery on it silently drops the DM
      // even though we have everything needed to send one.
      let dmSent = false;
      try {
        if (result.userId && result.accessToken) {
          // Authenticate the DM with the bot token freshly issued by this
          // exchange (not a static env var, which dies under token rotation).
          const slackClient = createSlackClient(undefined, result.botAccessToken);
          const tokenMessage = formatTokenMessage(
            result.accessToken,
            result.user?.name,
            result.refreshToken
          );

          await slackClient.sendDirectMessage(
            result.userId,
            tokenMessage.text,
            tokenMessage.blocks
          );

          requestLogger.info('Token sent via DM', {
            userId: result.userId,
          });
          dmSent = true;
        } else {
          // Successful exchange but DM preconditions unmet: most likely a
          // bot-only install (no user scopes granted -> no authed_user.id, so
          // result.userId is undefined). The success-page fallback still
          // delivers the tokens, but surface a warn so a missing-user-scope
          // misconfiguration is diagnosable rather than inferred from the
          // info-level 'OAuth flow successful' breadcrumb.
          requestLogger.warn('DM skipped: missing userId or accessToken on successful exchange', {
            hasUserId: !!result.userId,
            hasAccessToken: !!result.accessToken,
          });
        }
      } catch (dmError) {
        // Don't fail the flow (the success-page fallback still delivers tokens),
        // but surface the underlying Slack error so DM failures are diagnosable
        // instead of vanishing into a generic message.
        const slackError =
          (dmError as { details?: { originalError?: { data?: { error?: string } } } })?.details
            ?.originalError?.data?.error ??
          (dmError as { code?: string })?.code ??
          (dmError instanceof Error ? dmError.message : 'unknown');
        requestLogger.error('Failed to send token via DM', dmError, {
          userId: result.userId,
          slackError,
        });
        dmSent = false;
      }

      // Send success page with token displayed if DM failed
      // Generate refresh URL based on request host
      const refreshUrl = `${req.protocol}://${req.get('host')}/slack/refresh`;
      // Fallback delivery when the DM didn't go out: render BOTH tokens so the
      // user can complete setup. The no-store/no-cache headers set below keep
      // this response out of shared caches, and the access token (also a secret)
      // is shown under those same headers, so the refresh token is no less safe
      // to display here. Without this, a failed DM leaves the user with no way
      // to obtain their refresh token.
      const successPage = formatSuccessPage(
        result.user?.name,
        dmSent ? undefined : result.accessToken,
        dmSent ? undefined : result.refreshToken,
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
    // Cookie flags are inlined (not spread) so Semgrep's matcher can see
    // secure/httpOnly/sameSite at the call site. These MUST stay in sync with
    // browserNonceCookieBaseOptions, which clearCookie() below uses to clear it.
    res.cookie(OAUTH_STATE_COOKIE, browserNonce, {
      httpOnly: true,
      secure: config.nodeEnv !== 'development' && config.nodeEnv !== 'test',
      sameSite: 'lax' as const,
      path: '/slack/oauth',
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
