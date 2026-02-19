/**
 * Inngest Serve Handler for Fastify
 *
 * Registers the Inngest API route on a Fastify server using the official
 * Fastify plugin. This exposes the `/api/inngest` endpoint that the
 * Inngest platform uses to discover and invoke functions.
 */

import type { FastifyInstance } from 'fastify';
import { default as inngestFastify } from 'inngest/fastify';

import { inngest } from './client.js';
import { reviewPipeline } from './review-pipeline.js';

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(message: string): void {
  console.log(`[inngest-serve] ${message}`);
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Registers the Inngest Fastify plugin on the server.
 *
 * This adds a route (typically at `/api/inngest`) that the Inngest platform
 * uses to:
 * - Discover available functions via GET
 * - Invoke function steps via POST
 * - Perform health checks
 *
 * @param server - The Fastify server instance to register on
 */
export async function registerInngestRoutes(server: FastifyInstance): Promise<void> {
  log('Registering Inngest routes...');

  await server.register(inngestFastify, {
    client: inngest,
    functions: [reviewPipeline],
  });

  log('Inngest routes registered');
}
