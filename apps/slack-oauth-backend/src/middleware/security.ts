import { Request, Response, NextFunction, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Rate limiter for OAuth endpoints
 * Prevents abuse by limiting requests per IP
 *
 * Note: express 5 ships its own types while express-rate-limit's DT types
 * reference express 4's type definitions. To avoid cross-version type
 * incompatibilities while keeping runtime behavior, we cast the produced
 * middleware to an Express RequestHandler.
 */
const _oauthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many OAuth attempts from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: any, res: any) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent'),
    });
    res.status(429).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Too Many Requests</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
              backdrop-filter: blur(10px);
            }
            h1 { font-size: 48px; margin-bottom: 20px; }
            p { font-size: 18px; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏱️ Too Many Requests</h1>
            <p>You've made too many OAuth attempts. Please wait 15 minutes before trying again.</p>
            <p>This limit helps protect our service from abuse.</p>
          </div>
        </body>
      </html>
    `);
  },
} as any) as unknown as RequestHandler;
export const oauthRateLimiter: RequestHandler = _oauthRateLimiter;

/**
 * General rate limiter for API endpoints
 */
const _apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
} as any) as unknown as RequestHandler;
export const apiRateLimiter: RequestHandler = _apiRateLimiter;

/**
 * Validates OAuth callback parameters
 */
export const validateOAuthCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { code, state, error } = req.query;
  const errors: string[] = [];

  // Check for OAuth error response
  if (error) {
    logger.warn('OAuth error received', {
      error,
      description: req.query.error_description,
    });
    return next();
  }

  // Validate code parameter
  if (!code && !error) {
    errors.push('Missing authorization code');
  } else if (code && typeof code !== 'string') {
    errors.push('Invalid authorization code format');
  } else if (code && code.length > 2000) {
    errors.push('Authorization code too long');
  }

  // Validate state parameter
  if (!state && !error) {
    errors.push('Missing state parameter');
  } else if (state && typeof state !== 'string') {
    errors.push('Invalid state parameter format');
  } else if (state && state.length < 16) {
    errors.push('State parameter too short');
  } else if (state && state.length > 500) {
    errors.push('State parameter too long');
  } else if (state && !/^[a-zA-Z0-9_-]+$/.test(state as string)) {
    errors.push('State parameter contains invalid characters');
  }

  if (errors.length > 0) {
    logger.warn('OAuth validation failed', { errors, query: req.query });
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invalid Request</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%);
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
              backdrop-filter: blur(10px);
              max-width: 600px;
            }
            h1 { font-size: 48px; margin-bottom: 20px; }
            .error-list {
              text-align: left;
              display: inline-block;
              margin: 20px 0;
            }
            .error-list li {
              margin: 10px 0;
            }
            a {
              color: white;
              text-decoration: underline;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Invalid Request</h1>
            <p>The OAuth request validation failed:</p>
            <ul class="error-list">
              ${errors.map((err) => `<li>${err}</li>`).join('')}
            </ul>
            <p><a href="/slack/oauth/authorize">Try Again</a></p>
          </div>
        </body>
      </html>
    `);
  }

  next();
};

/**
 * Validates OAuth authorize parameters
 */
export const validateOAuthAuthorize = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Validate any custom scopes if provided via query params
  const { scope } = req.query;

  if (scope) {
    if (typeof scope !== 'string') {
      return res.status(400).json({ error: 'Invalid scope format' });
    }

    // Validate scope format (comma or space separated list)
    const scopePattern = /^[a-zA-Z0-9:_,.\s-]+$/;
    if (!scopePattern.test(scope)) {
      return res.status(400).json({ error: 'Invalid scope characters' });
    }

    // Check scope length
    if (scope.length > 500) {
      return res.status(400).json({ error: 'Scope parameter too long' });
    }
  }

  return next();
};

/**
 * Security headers middleware using Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for error pages
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
});

/**
 * HTTPS enforcement middleware (for production)
 */
export const enforceHTTPS = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip in development/test environments
  if (config.nodeEnv === 'development' || config.nodeEnv === 'test') {
    return next();
  }

  // Check if request is already HTTPS
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

  if (!isHttps) {
    logger.warn('Insecure HTTP request attempted', {
      ip: req.ip,
      path: req.path,
      host: req.hostname,
    });

    // Validate hostname to prevent open redirect
    const allowedHosts = process.env.ALLOWED_HOSTS?.split(',') || [
      req.hostname,
    ];
    const hostname = req.hostname;

    if (!allowedHosts.includes(hostname)) {
      logger.error('Invalid hostname in HTTPS redirect', {
        hostname,
        allowedHosts,
      });
      return res.status(400).send('Invalid request');
    }

    // Redirect to HTTPS with validated hostname
    const httpsUrl = `https://${hostname}${req.originalUrl}`;
    return res.redirect(301, httpsUrl);
  }

  next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });

  next();
};

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      const value = req.query[key];
      if (typeof value === 'string') {
        // Remove any HTML tags and trim whitespace
        req.query[key] = value.replace(/<[^>]*>/g, '').trim();
      }
    });
  }

  // Sanitize body parameters (if any)
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach((key) => {
      const value = req.body[key];
      if (typeof value === 'string') {
        // Remove any HTML tags and trim whitespace
        req.body[key] = value.replace(/<[^>]*>/g, '').trim();
      }
    });
  }

  next();
};
