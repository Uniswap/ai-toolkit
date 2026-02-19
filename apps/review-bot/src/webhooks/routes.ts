/**
 * Fastify route registration for GitHub webhook events.
 *
 * Registers a POST route at `/api/webhooks/github` that:
 * 1. Captures the raw request body for HMAC signature verification
 * 2. Verifies the webhook signature using @octokit/webhooks
 * 3. Dispatches events to the appropriate handler
 * 4. Returns 200 immediately after dispatching
 *
 * IMPORTANT: Fastify parses JSON bodies by default. For webhook
 * signature verification, we need access to the raw body. This is
 * handled by adding a custom content type parser that preserves
 * the raw body buffer alongside the parsed JSON.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Webhooks } from '@octokit/webhooks';

import { inngest } from '../inngest/client.js';
import type { WebhookHandlers } from './handler.js';
import type { ReviewRequestedEvent } from './types.js';

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(message: string): void {
  console.log(`[webhook-routes] ${message}`);
}

function logError(message: string): void {
  console.error(`[webhook-routes] ERROR: ${message}`);
}

// ---------------------------------------------------------------------------
// Route Registration
// ---------------------------------------------------------------------------

/**
 * Registers the GitHub webhook route on the Fastify server.
 *
 * @param server - The Fastify server instance
 * @param webhookSecret - The GitHub webhook secret for signature verification
 * @param handlers - The webhook event handlers from `createWebhookHandlers`
 */
export function registerWebhookRoutes(
  server: FastifyInstance,
  webhookSecret: string,
  handlers: WebhookHandlers
): void {
  const webhooks = new Webhooks({ secret: webhookSecret });

  // Add a custom content type parser to preserve raw body for signature verification.
  // This overrides Fastify's default JSON parser for this route.
  server.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (
      _request: FastifyRequest,
      body: Buffer,
      done: (err: Error | null, result?: unknown) => void
    ) => {
      try {
        // Convert buffer to string for JSON parsing and signature verification
        const rawBody = body.toString('utf-8');
        // Store raw body for signature verification, return parsed JSON as body
        const parsed: unknown = JSON.parse(rawBody);
        // Attach raw body to the parsed result using a wrapper
        done(null, { _rawBody: rawBody, _parsed: parsed });
      } catch (err) {
        done(err instanceof Error ? err : new Error(String(err)));
      }
    }
  );

  server.post('/api/webhooks/github', async (request: FastifyRequest, reply: FastifyReply) => {
    const eventName = request.headers['x-github-event'] as string | undefined;
    const signature = request.headers['x-hub-signature-256'] as string | undefined;
    const deliveryId = request.headers['x-github-delivery'] as string | undefined;

    if (!eventName || !signature) {
      log('Missing required webhook headers');
      return reply.status(400).send({ error: 'Missing required webhook headers' });
    }

    // Extract raw body and parsed payload from our custom parser wrapper
    const bodyWrapper = request.body as { _rawBody?: string; _parsed?: unknown } | undefined;
    const rawBody = bodyWrapper?._rawBody;
    const payload = bodyWrapper?._parsed;

    if (!rawBody || !payload) {
      log('Missing request body');
      return reply.status(400).send({ error: 'Missing request body' });
    }

    // Verify webhook signature
    const isValid = await webhooks.verify(rawBody, signature);
    if (!isValid) {
      logError('Invalid webhook signature');
      return reply.status(401).send({ error: 'Invalid signature' });
    }

    log(`Received webhook: ${eventName} (delivery: ${deliveryId ?? 'unknown'})`);

    // Dispatch to appropriate handler based on event type and action
    try {
      const action = (payload as Record<string, unknown>).action as string | undefined;
      const eventKey = action ? `${eventName}.${action}` : eventName;

      const result = await dispatchEvent(handlers, eventKey, payload);

      if (result?.event) {
        log(`Handler produced event: ${result.event.name}`);
        log(`Event data: ${JSON.stringify(result.event.data)}`);

        // Send event to Inngest for durable async processing.
        // The handler result event is typed as ReviewRequestedEvent,
        // which matches the Inngest event schema.
        const event = result.event as ReviewRequestedEvent;
        await inngest.send({
          name: event.name,
          data: event.data,
        });
        log('Event sent to Inngest');
      }

      return reply.status(200).send({ received: true });
    } catch (error) {
      logError(`Error processing webhook: ${String(error)}`);
      // Return 200 even on handler errors to prevent GitHub from retrying
      // Handler errors are logged and can be monitored
      return reply.status(200).send({ received: true, error: 'Handler error' });
    }
  });
}

// ---------------------------------------------------------------------------
// Event Dispatcher
// ---------------------------------------------------------------------------

/**
 * Routes a webhook event to the appropriate handler based on the event key.
 *
 * @param handlers - The webhook event handlers
 * @param eventKey - The event key in "event.action" format
 * @param payload - The raw webhook payload
 * @returns The handler result, or null if no handler matched
 */
async function dispatchEvent(
  handlers: WebhookHandlers,
  eventKey: string,
  payload: unknown
): Promise<{ event: { name: string; data: unknown } | null } | null> {
  switch (eventKey) {
    case 'pull_request.opened':
      return handlers.onPullRequestOpened(
        payload as Parameters<WebhookHandlers['onPullRequestOpened']>[0]
      );

    case 'pull_request.synchronize':
      return handlers.onPullRequestSynchronize(
        payload as Parameters<WebhookHandlers['onPullRequestSynchronize']>[0]
      );

    case 'pull_request.ready_for_review':
      return handlers.onPullRequestReadyForReview(
        payload as Parameters<WebhookHandlers['onPullRequestReadyForReview']>[0]
      );

    case 'issue_comment.created':
      return handlers.onIssueComment(payload as Parameters<WebhookHandlers['onIssueComment']>[0]);

    case 'installation.created':
      return handlers.onInstallationCreated(
        payload as Parameters<WebhookHandlers['onInstallationCreated']>[0]
      );

    case 'installation.deleted':
      return handlers.onInstallationDeleted(
        payload as Parameters<WebhookHandlers['onInstallationDeleted']>[0]
      );

    case 'installation_repositories.added':
      return handlers.onInstallationRepositoriesAdded(
        payload as Parameters<WebhookHandlers['onInstallationRepositoriesAdded']>[0]
      );

    case 'installation_repositories.removed':
      return handlers.onInstallationRepositoriesRemoved(
        payload as Parameters<WebhookHandlers['onInstallationRepositoriesRemoved']>[0]
      );

    default:
      log(`Unhandled event: ${eventKey}`);
      return null;
  }
}
