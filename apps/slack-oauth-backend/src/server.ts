import type { Express, Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './utils/errors';
import oauthRoutes from './routes/oauth';
import indexRoutes from './routes/index';
import {
  securityHeaders,
  enforceHTTPS,
  requestLogger,
  sanitizeInput,
  apiRateLimiter,
} from './middleware/security';

/**
 * Create and configure Express server
 */
export function createServer(): Express {
  const app = express();

  // Security middleware (can be disabled for testing)
  if (process.env['DISABLE_SECURITY'] !== 'true') {
    app.use(enforceHTTPS);
    app.use(securityHeaders);
  }

  // CORS configuration
  if (config.corsOrigin) {
    app.use(
      cors({
        origin: config.corsOrigin,
        credentials: true,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );
  }

  // Body parsing middleware
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Input sanitization
  app.use(sanitizeInput);

  // Request logging
  app.use(requestLogger);

  // Apply general rate limiting to all routes
  app.use(apiRateLimiter);

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // Routes
  app.use('/', indexRoutes);
  app.use('/slack/oauth', oauthRoutes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: {
        message: 'Resource not found',
        path: req.path,
      },
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
export async function startServer(): Promise<void> {
  try {
    // Validate configuration on startup
    const { validateConfig } = await import('./config/index.js');
    validateConfig();

    const app = createServer();
    const port = config.port;

    const server = app.listen(port, () => {
      logger.info(`🚀 Slack OAuth Backend server started`, {
        port,
        environment: config.nodeEnv,
        pid: process.pid,
      });

      logger.info(`📍 Server endpoints:`, {
        home: `http://localhost:${port}/`,
        callback: `http://localhost:${port}/slack/oauth/callback`,
        health: `http://localhost:${port}/health`,
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Clean up resources
          const { clearSlackCaches, getCacheStats } = await import(
            './slack/client.js'
          );
          const { tokenValidationCache } = await import('./utils/cache.js');

          // Log cache statistics before cleanup
          logger.info('Cache statistics at shutdown', getCacheStats());

          // Clear all caches
          clearSlackCaches();
          tokenValidationCache.destroy();

          // Close HTTPS agent connections
          const https = await import('https');
          if (https.globalAgent) {
            https.globalAgent.destroy();
          }

          logger.info('Resources cleaned up successfully');
        } catch (error) {
          logger.error('Error during cleanup:', error);
        }

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forcefully shutting down after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: any, _promise: Promise<any>) => {
      logger.error('Unhandled rejection:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export for testing
export default createServer;
