import type { Request, Response } from 'express';
import { Router } from 'express';
import { config } from '../config';
import { createSlackClient } from '../slack/client';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Landing page with Add to Slack button
 * GET /
 */
router.get('/', (_req: Request, res: Response) => {
  // Use our centralized OAuth authorize endpoint so scopes stay in sync
  const slackAuthUrl = `/slack/oauth/authorize`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Slack OAuth Integration</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          padding: 60px;
          max-width: 600px;
          width: 100%;
          text-align: center;
        }

        .logo {
          width: 100px;
          height: 100px;
          margin: 0 auto 32px;
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
        }

        h1 {
          color: #1f2937;
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        .subtitle {
          color: #6b7280;
          font-size: 20px;
          line-height: 1.6;
          margin-bottom: 48px;
        }

        .features {
          display: grid;
          gap: 24px;
          margin-bottom: 48px;
          text-align: left;
        }

        .feature {
          display: flex;
          align-items: start;
          gap: 16px;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: #f3f4f6;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 24px;
        }

        .feature-content h3 {
          color: #1f2937;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .feature-content p {
          color: #6b7280;
          font-size: 15px;
          line-height: 1.5;
        }

        .slack-button {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: #4a154b;
          color: white;
          padding: 16px 32px;
          border-radius: 12px;
          text-decoration: none;
          font-size: 18px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(74, 21, 75, 0.3);
        }

        .slack-button:hover {
          background: #611f69;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(74, 21, 75, 0.4);
        }

        .slack-button svg {
          width: 24px;
          height: 24px;
        }

        .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 48px 0;
        }

        .info {
          background: #f9fafb;
          border-radius: 12px;
          padding: 20px;
          margin-top: 32px;
        }

        .info-title {
          color: #1f2937;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          text-align: left;
        }

        .info-text {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
          text-align: left;
        }

        .footer {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
          color: #9ca3af;
          font-size: 14px;
        }

        .footer a {
          color: #7c3aed;
          text-decoration: none;
        }

        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🔐</div>

        <h1>Slack OAuth Integration</h1>
        <p class="subtitle">Securely generate and receive your Slack access token via direct message</p>

        <div class="features">
          <div class="feature">
            <div class="feature-icon">🛡️</div>
            <div class="feature-content">
              <h3>Secure Authentication</h3>
              <p>OAuth 2.0 flow with state validation for maximum security</p>
            </div>
          </div>

          <div class="feature">
            <div class="feature-icon">📨</div>
            <div class="feature-content">
              <h3>Direct Delivery</h3>
              <p>Receive your access token privately via Slack DM</p>
            </div>
          </div>

          <div class="feature">
            <div class="feature-icon">📚</div>
            <div class="feature-content">
              <h3>Easy Setup</h3>
              <p>Complete documentation and setup instructions included</p>
            </div>
          </div>
        </div>

        <a href="${slackAuthUrl}" class="slack-button">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
          </svg>
          Add to Slack
        </a>

        <div class="info">
          <div class="info-title">What happens next?</div>
          <div class="info-text">
            After authorizing, you'll receive your access token via Slack direct message.
            The token can be used to integrate with Slack's APIs according to the permissions you grant.
          </div>
        </div>

        <div class="footer">
          Need help? Check our <a href="${config.notionDocUrl}" target="_blank">documentation</a>
        </div>
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

/**
 * Health check endpoint
 * GET /health
 */
router.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  try {
    // Test Slack bot authentication (if bot token is configured)
    const slackClient = createSlackClient();
    const authTest = await slackClient.testAuth();

    // Get cache statistics
    const { getCacheStats } = await import('../slack/client.js');
    const cacheStats = getCacheStats();

    // Determine slack status based on whether bot token is configured
    const slackStatus = authTest
      ? {
          connected: authTest.success,
          teamName: authTest.teamName,
          botId: authTest.botId,
        }
      : {
          connected: false,
          mode: 'token_rotation',
          note: 'Bot token not configured - using token rotation mode',
        };

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      responseTime: `${Date.now() - startTime}ms`,
      environment: config.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
      node: {
        version: process.version,
        memory: {
          used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        },
      },
      slack: slackStatus,
      cache: {
        userInfo: {
          size: cacheStats.userInfo.size,
          hitRate: cacheStats.userInfo.hitRate,
        },
        channels: {
          size: cacheStats.channels.size,
          hitRate: cacheStats.channels.hitRate,
        },
      },
    });
  } catch (error) {
    logger.error('Health check failed', error);

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      responseTime: `${Date.now() - startTime}ms`,
      environment: config.nodeEnv,
      error: 'Slack connection failed',
      details:
        config.nodeEnv === 'development' ? (error as Error).message : undefined,
    });
  }
});

/**
 * Metrics endpoint (Prometheus-compatible format)
 * GET /metrics
 */
router.get('/metrics', async (_req: Request, res: Response) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  // Get cache statistics
  const { getCacheStats } = await import('../slack/client.js');
  const cacheStats = getCacheStats();

  // Format metrics in Prometheus text format
  const metrics = [
    '# HELP app_uptime_seconds Application uptime in seconds',
    '# TYPE app_uptime_seconds gauge',
    `app_uptime_seconds ${uptime}`,
    '',
    '# HELP nodejs_heap_used_bytes Node.js heap memory used',
    '# TYPE nodejs_heap_used_bytes gauge',
    `nodejs_heap_used_bytes ${memoryUsage.heapUsed}`,
    '',
    '# HELP nodejs_heap_total_bytes Node.js heap memory total',
    '# TYPE nodejs_heap_total_bytes gauge',
    `nodejs_heap_total_bytes ${memoryUsage.heapTotal}`,
    '',
    '# HELP cache_size Number of items in cache',
    '# TYPE cache_size gauge',
    `cache_size{type="userInfo"} ${cacheStats.userInfo.size}`,
    `cache_size{type="channels"} ${cacheStats.channels.size}`,
    '',
    '# HELP cache_hits_total Total number of cache hits',
    '# TYPE cache_hits_total counter',
    `cache_hits_total{type="userInfo"} ${cacheStats.userInfo.hits}`,
    `cache_hits_total{type="channels"} ${cacheStats.channels.hits}`,
    '',
    '# HELP cache_misses_total Total number of cache misses',
    '# TYPE cache_misses_total counter',
    `cache_misses_total{type="userInfo"} ${cacheStats.userInfo.misses}`,
    `cache_misses_total{type="channels"} ${cacheStats.channels.misses}`,
  ].join('\n');

  res.type('text/plain').send(metrics);
});

export default router;
