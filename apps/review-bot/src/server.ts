/**
 * Fastify Server Factory
 *
 * Creates and configures the Fastify server with all routes:
 * - Health check endpoint (GET /health)
 * - GitHub webhook routes (POST /api/webhooks/github)
 * - Inngest serve endpoint (via Fastify plugin)
 * - CORS for dashboard access
 *
 * The server is configured but NOT started here. The main.ts
 * entry point handles starting and graceful shutdown.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';

import type { Env } from './config/env.js';
import { createDb } from './db/connection.js';
import type { Database } from './db/connection.js';
import { registerInngestRoutes } from './inngest/serve.js';
import { createWebhookHandlers } from './webhooks/handler.js';
import { registerWebhookRoutes } from './webhooks/routes.js';

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(message: string): void {
  console.log(`[server] ${message}`);
}

// ---------------------------------------------------------------------------
// Server Factory
// ---------------------------------------------------------------------------

/**
 * Creates a fully configured Fastify server with all routes registered.
 *
 * @param env - Validated environment configuration
 * @returns Object with the server instance and DB connection for lifecycle management
 */
export async function createServer(env: Env): Promise<{
  server: FastifyInstance;
  db: Database;
}> {
  const server = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
  });

  // -------------------------------------------------------------------------
  // CORS
  // -------------------------------------------------------------------------
  await server.register(cors, {
    origin: env.NODE_ENV === 'development',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // -------------------------------------------------------------------------
  // Database
  // -------------------------------------------------------------------------
  const db = createDb(env.DATABASE_URL);
  log('Database connection created');

  // -------------------------------------------------------------------------
  // Health Check
  // -------------------------------------------------------------------------
  server.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
    };
  });

  // -------------------------------------------------------------------------
  // Webhook Routes
  // -------------------------------------------------------------------------
  const webhookHandlers = createWebhookHandlers(db);
  registerWebhookRoutes(server, env.GITHUB_WEBHOOK_SECRET, webhookHandlers);
  log('Webhook routes registered');

  // -------------------------------------------------------------------------
  // Inngest Routes
  // -------------------------------------------------------------------------
  await registerInngestRoutes(server);
  log('Inngest routes registered');

  return { server, db };
}
