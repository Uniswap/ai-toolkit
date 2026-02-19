/**
 * Event types for Inngest integration.
 *
 * These represent the events that the webhook handler emits
 * for asynchronous processing via Inngest functions.
 */

/**
 * Event emitted when a PR review is requested, either via
 * PR open/sync, a comment trigger, or a manual request.
 */
export interface ReviewRequestedEvent {
  name: 'review-bot/pr.review-requested';
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
}
