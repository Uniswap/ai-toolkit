import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { createOAuthHandler } from '../oauth/handler';
import { createSlackClient } from '../slack/client';
import {
  formatTokenMessage,
  formatSuccessPage,
  formatErrorPage,
} from '../messages/formatter';
import { logger } from '../utils/logger';
import { OAuthError, ValidationError } from '../utils/errors';
import type { OAuthCallbackParams } from '../oauth/types';
import {
  oauthRateLimiter,
  validateOAuthCallback,
  validateOAuthAuthorize,
} from '../middleware/security';

const router = Router();

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
          params.error_description ||
            `OAuth authorization failed: ${params.error}`,
          'INVALID_CODE',
          { error: params.error }
        );
      }

      // Validate required parameters
      if (!params.code) {
        throw new ValidationError('Missing authorization code', 'code');
      }

      // Create OAuth handler with state validation
      const oauthHandler = createOAuthHandler((state) => {
        // In production, validate state against session or database
        // For now, just ensure it exists and has minimum length
        return typeof state === 'string' && state.length >= 16;
      });

      // Handle OAuth callback
      const result = await oauthHandler.handleCallback(params);

      if (!result.success) {
        requestLogger.warn('OAuth flow failed', {
          error: result.error,
          errorCode: result.errorCode,
        });

        // Send error page
        const errorPage = formatErrorPage(
          result.errorCode || 'unknown',
          result.error
        );

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
          const slackClient = createSlackClient();
          const tokenMessage = formatTokenMessage(
            result.accessToken,
            result.user.name
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
      const successPage = formatSuccessPage(
        result.user?.name,
        dmSent ? undefined : result.accessToken
      );
      res.send(successPage);
    } catch (error) {
      requestLogger.error('OAuth callback error', error);

      // If it's an OAuthError or ValidationError, handle it specially
      if (error instanceof OAuthError || error instanceof ValidationError) {
        const errorPage = formatErrorPage(
          error instanceof OAuthError ? (error.code as any) : 'unknown',
          error.message
        );

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
    const state = generateState();
    const oauthHandler = createOAuthHandler();
    const authUrl = oauthHandler.generateAuthUrl(state);

    // In production, store state in session or database
    // For now, just redirect
    res.redirect(authUrl);
  }
);

/**
 * Generate a random state parameter
 */
function generateState(): string {
  return `state_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export default router;
