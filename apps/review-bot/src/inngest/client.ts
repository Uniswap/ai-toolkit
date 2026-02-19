/**
 * Inngest Client
 *
 * Creates a typed Inngest client instance for the review bot application.
 * Defines the event schemas used across all Inngest functions for type-safe
 * event sending and consumption.
 */

import { EventSchemas, Inngest } from 'inngest';

// ---------------------------------------------------------------------------
// Event Types
// ---------------------------------------------------------------------------

/**
 * Maps event names to their payload shapes for type-safe event handling.
 *
 * Each key is a fully-qualified event name using the "review-bot/" prefix.
 * The `data` field matches the shape emitted by webhook handlers.
 */
type Events = {
  'review-bot/pr.review-requested': {
    data: {
      installationId: number;
      owner: string;
      repo: string;
      prNumber: number;
      headSha: string;
      baseRef: string;
      trigger: 'push' | 'comment' | 'manual';
      senderLogin: string;
    };
  };
};

// ---------------------------------------------------------------------------
// Client Instance
// ---------------------------------------------------------------------------

/**
 * Singleton Inngest client used by all review bot functions.
 *
 * The `id` identifies this application in the Inngest dashboard.
 * Event schemas provide compile-time type checking for event payloads.
 */
export const inngest = new Inngest({
  id: 'review-bot',
  schemas: new EventSchemas().fromRecord<Events>(),
});
