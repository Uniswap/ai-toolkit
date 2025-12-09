import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { WebClient } from '@slack/web-api';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

const router = Router();

/**
 * Rate limiter for token refresh endpoint
 * More restrictive than OAuth endpoints due to sensitivity
 */
const refreshRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  message: 'Too many token refresh attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Refresh rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      ok: false,
      error: 'too_many_requests',
    });
  },
});

/**
 * Validate refresh token request body
 */
const validateRefreshRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { refresh_token } = req.body;

  // Validate refresh_token is present
  if (!refresh_token) {
    logger.warn('Refresh request missing refresh_token', {
      ip: req.ip,
      hasBody: !!req.body,
    });
    res.status(400).json({
      ok: false,
      error: 'missing_refresh_token',
    });
    return;
  }

  // Validate refresh_token is a string
  if (typeof refresh_token !== 'string') {
    logger.warn('Refresh request has invalid refresh_token type', {
      ip: req.ip,
      type: typeof refresh_token,
    });
    res.status(400).json({
      ok: false,
      error: 'invalid_refresh_token',
    });
    return;
  }

  // Validate refresh_token format (Slack refresh tokens start with xoxe)
  if (!refresh_token.startsWith('xoxe-')) {
    logger.warn('Refresh request has invalid refresh_token format', {
      ip: req.ip,
      prefix: refresh_token.substring(0, 5),
    });
    res.status(400).json({
      ok: false,
      error: 'invalid_refresh_token',
    });
    return;
  }

  // Validate refresh_token length (reasonable bounds)
  if (refresh_token.length < 20 || refresh_token.length > 500) {
    logger.warn('Refresh request has invalid refresh_token length', {
      ip: req.ip,
      length: refresh_token.length,
    });
    res.status(400).json({
      ok: false,
      error: 'invalid_refresh_token',
    });
    return;
  }

  next();
};

/**
 * Token refresh endpoint
 * POST /slack/refresh
 *
 * Exchanges a refresh token for a new access token
 * This keeps the client secret server-side for security
 */
router.post(
  '/',
  refreshRateLimiter,
  validateRefreshRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    const requestLogger = logger.child({ requestId: (req as any).id });

    try {
      const { refresh_token } = req.body;

      requestLogger.info('Token refresh request received', {
        hasRefreshToken: !!refresh_token,
        tokenPrefix: refresh_token?.substring(0, 10),
      });

      // Create Slack client (no token needed for oauth.v2.access)
      const slackClient = new WebClient();

      // Call Slack's oauth.v2.access to refresh the token
      const response = await slackClient.oauth.v2.access({
        client_id: config.slackClientId,
        client_secret: config.slackClientSecret,
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
      });

      // Check if the response is successful
      if (!response.ok) {
        const errorMessage = (response as { error?: string }).error || 'token_refresh_failed';
        requestLogger.warn('Token refresh failed', {
          error: errorMessage,
        });

        res.status(400).json({
          ok: false,
          error: errorMessage,
        });
        return;
      }

      // Extract tokens from successful response
      // Prefer User OAuth Token (xoxp) if present; otherwise fall back to Bot token (xoxb)
      // This matches the logic in oauth/handler.ts handleCallback
      const typedResponse = response as {
        access_token?: string;
        refresh_token?: string;
        authed_user?: {
          access_token?: string;
          refresh_token?: string;
        };
      };

      const userToken = typedResponse.authed_user?.access_token;
      const botToken = typedResponse.access_token;
      const accessToken = userToken || botToken;

      // For refresh tokens, also prefer the user's refresh token if available
      const userRefreshToken = typedResponse.authed_user?.refresh_token;
      const botRefreshToken = typedResponse.refresh_token;
      const newRefreshToken = userRefreshToken || botRefreshToken;

      if (!accessToken) {
        requestLogger.error('Token refresh succeeded but no access token returned');
        res.status(500).json({
          ok: false,
          error: 'invalid_response',
        });
        return;
      }

      requestLogger.info('Token refresh successful', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!newRefreshToken,
        tokenType: userToken ? 'user' : 'bot',
      });

      // Return the new tokens
      res.json({
        ok: true,
        access_token: accessToken,
        refresh_token: newRefreshToken,
      });
    } catch (error) {
      requestLogger.error('Token refresh error', error);

      // Don't leak internal error details
      if (error instanceof ValidationError) {
        res.status(400).json({
          ok: false,
          error: 'validation_error',
        });
        return;
      }

      // Pass unexpected errors to error handler
      next(error);
    }
  }
);

export default router;
