/**
 * Webhook event handlers for GitHub App events.
 *
 * These handlers process incoming webhook payloads and perform
 * database operations (installation/repository tracking) and
 * return events to be dispatched to Inngest for async processing.
 *
 * The handler functions are grouped by event type:
 * - PR events: trigger review requests
 * - Issue comment events: detect @request-claude-review mentions
 * - Installation events: track app installations
 * - Installation repository events: track repository additions/removals
 */

import { eq } from 'drizzle-orm';

import type { Database } from '../db/index.js';
import { installations, repositories } from '../db/index.js';
import { findOrCreateInstallation, findOrCreateRepository } from '../db/queries.js';

import type { ReviewRequestedEvent } from './types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The trigger keyword that users can include in a comment to request a review. */
const REVIEW_TRIGGER = '@request-claude-review';

/**
 * Result of processing a webhook event.
 * Contains an optional Inngest event to dispatch.
 */
export interface WebhookHandlerResult {
  event: ReviewRequestedEvent | null;
}

// ---------------------------------------------------------------------------
// Payload types (subset of GitHub webhook payloads we actually use)
// ---------------------------------------------------------------------------

interface PullRequestPayload {
  action: string;
  pull_request: {
    number: number;
    draft: boolean;
    head: { sha: string };
    base: { ref: string };
    user: { login: string };
  };
  repository: {
    id: number;
    name: string;
    owner: { login: string };
    full_name: string;
  };
  installation?: { id: number };
  sender: { login: string };
}

interface IssueCommentPayload {
  action: string;
  comment: {
    body: string;
    user: { login: string };
  };
  issue: {
    number: number;
    pull_request?: { url: string };
  };
  repository: {
    id: number;
    name: string;
    owner: { login: string };
    full_name: string;
  };
  installation?: { id: number };
  sender: { login: string };
}

interface InstallationPayload {
  action: string;
  installation: {
    id: number;
    account: {
      login: string;
      type: string;
    };
  };
  repositories?: Array<{
    id: number;
    name: string;
    full_name: string;
  }>;
  sender: { login: string };
}

interface InstallationRepositoriesPayload {
  action: string;
  installation: {
    id: number;
    account: {
      login: string;
      type: string;
    };
  };
  repositories_added: Array<{
    id: number;
    name: string;
    full_name: string;
  }>;
  repositories_removed: Array<{
    id: number;
    name: string;
    full_name: string;
  }>;
  sender: { login: string };
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(message: string): void {
  console.log(`[webhook-handler] ${message}`);
}

// ---------------------------------------------------------------------------
// Handler Factory
// ---------------------------------------------------------------------------

/**
 * Creates webhook event handlers bound to a database instance.
 *
 * Each handler processes its respective webhook event, performs
 * necessary database operations, and returns a result containing
 * an optional Inngest event to dispatch.
 */
export function createWebhookHandlers(db: Database) {
  return {
    /**
     * Handles pull_request.opened events.
     * Triggers a review for newly opened non-draft PRs.
     */
    async onPullRequestOpened(payload: PullRequestPayload): Promise<WebhookHandlerResult> {
      const { pull_request: pr, repository: repo, installation, sender } = payload;

      if (pr.draft) {
        log(`Skipping draft PR #${pr.number}`);
        return { event: null };
      }

      if (!installation) {
        log('No installation ID in payload, skipping');
        return { event: null };
      }

      const inst = await findOrCreateInstallation(db, {
        githubInstallationId: installation.id,
        accountLogin: repo.owner.login,
        accountType: 'Organization', // Webhook doesn't provide this reliably; default to Organization
      });

      await findOrCreateRepository(db, {
        installationId: inst.id,
        githubRepoId: repo.id,
        owner: repo.owner.login,
        name: repo.name,
      });

      log(`PR #${pr.number} opened in ${repo.full_name}, triggering review`);

      return {
        event: {
          name: 'review-bot/pr.review-requested',
          data: {
            installationId: installation.id,
            owner: repo.owner.login,
            repo: repo.name,
            prNumber: pr.number,
            headSha: pr.head.sha,
            baseRef: pr.base.ref,
            trigger: 'push',
            senderLogin: sender.login,
          },
        },
      };
    },

    /**
     * Handles pull_request.synchronize events.
     * Triggers a review when new commits are pushed to a non-draft PR.
     */
    async onPullRequestSynchronize(payload: PullRequestPayload): Promise<WebhookHandlerResult> {
      const { pull_request: pr, repository: repo, installation, sender } = payload;

      if (pr.draft) {
        log(`Skipping draft PR #${pr.number}`);
        return { event: null };
      }

      if (!installation) {
        log('No installation ID in payload, skipping');
        return { event: null };
      }

      const inst = await findOrCreateInstallation(db, {
        githubInstallationId: installation.id,
        accountLogin: repo.owner.login,
        accountType: 'Organization',
      });

      await findOrCreateRepository(db, {
        installationId: inst.id,
        githubRepoId: repo.id,
        owner: repo.owner.login,
        name: repo.name,
      });

      log(`PR #${pr.number} synchronized in ${repo.full_name}, triggering review`);

      return {
        event: {
          name: 'review-bot/pr.review-requested',
          data: {
            installationId: installation.id,
            owner: repo.owner.login,
            repo: repo.name,
            prNumber: pr.number,
            headSha: pr.head.sha,
            baseRef: pr.base.ref,
            trigger: 'push',
            senderLogin: sender.login,
          },
        },
      };
    },

    /**
     * Handles pull_request.ready_for_review events.
     * Triggers a review when a draft PR is marked as ready.
     */
    async onPullRequestReadyForReview(payload: PullRequestPayload): Promise<WebhookHandlerResult> {
      const { pull_request: pr, repository: repo, installation, sender } = payload;

      if (!installation) {
        log('No installation ID in payload, skipping');
        return { event: null };
      }

      const inst = await findOrCreateInstallation(db, {
        githubInstallationId: installation.id,
        accountLogin: repo.owner.login,
        accountType: 'Organization',
      });

      await findOrCreateRepository(db, {
        installationId: inst.id,
        githubRepoId: repo.id,
        owner: repo.owner.login,
        name: repo.name,
      });

      log(`PR #${pr.number} marked ready for review in ${repo.full_name}, triggering review`);

      return {
        event: {
          name: 'review-bot/pr.review-requested',
          data: {
            installationId: installation.id,
            owner: repo.owner.login,
            repo: repo.name,
            prNumber: pr.number,
            headSha: pr.head.sha,
            baseRef: pr.base.ref,
            trigger: 'push',
            senderLogin: sender.login,
          },
        },
      };
    },

    /**
     * Handles issue_comment.created events.
     * Triggers a review when a comment contains the trigger keyword.
     *
     * Only processes comments on pull requests (issue_comment events
     * fire for both issues and PRs).
     */
    async onIssueComment(payload: IssueCommentPayload): Promise<WebhookHandlerResult> {
      const { action, comment, issue, repository: repo, installation, sender } = payload;

      // Only process created comments
      if (action !== 'created') {
        return { event: null };
      }

      // Only process comments on PRs (not issues)
      if (!issue.pull_request) {
        return { event: null };
      }

      // Check if the comment contains the trigger keyword
      if (!comment.body.includes(REVIEW_TRIGGER)) {
        return { event: null };
      }

      if (!installation) {
        log('No installation ID in payload, skipping');
        return { event: null };
      }

      const inst = await findOrCreateInstallation(db, {
        githubInstallationId: installation.id,
        accountLogin: repo.owner.login,
        accountType: 'Organization',
      });

      await findOrCreateRepository(db, {
        installationId: inst.id,
        githubRepoId: repo.id,
        owner: repo.owner.login,
        name: repo.name,
      });

      log(
        `Review requested via comment by ${comment.user.login} on PR #${issue.number} in ${repo.full_name}`
      );

      // For comment-triggered reviews, we don't have the head SHA readily
      // available from the issue_comment payload. The downstream Inngest
      // function will need to fetch the PR details to get the current head SHA.
      // We pass empty string here; the consumer should fetch fresh PR data.
      return {
        event: {
          name: 'review-bot/pr.review-requested',
          data: {
            installationId: installation.id,
            owner: repo.owner.login,
            repo: repo.name,
            prNumber: issue.number,
            headSha: '', // Will be fetched by the Inngest function
            baseRef: '', // Will be fetched by the Inngest function
            trigger: 'comment',
            senderLogin: sender.login,
          },
        },
      };
    },

    /**
     * Handles installation.created events.
     * Records the new installation in the database.
     */
    async onInstallationCreated(payload: InstallationPayload): Promise<WebhookHandlerResult> {
      const { installation: inst } = payload;

      log(`Installation created: ${inst.account.login} (${inst.account.type})`);

      const dbInstallation = await findOrCreateInstallation(db, {
        githubInstallationId: inst.id,
        accountLogin: inst.account.login,
        accountType: inst.account.type,
      });

      // Track any repositories included in the installation
      if (payload.repositories) {
        for (const repo of payload.repositories) {
          const [owner, name] = repo.full_name.split('/');
          await findOrCreateRepository(db, {
            installationId: dbInstallation.id,
            githubRepoId: repo.id,
            owner,
            name,
          });
        }
        log(`Tracked ${payload.repositories.length} repositories for installation`);
      }

      return { event: null };
    },

    /**
     * Handles installation.deleted events.
     * Marks the installation as disabled in the database.
     */
    async onInstallationDeleted(payload: InstallationPayload): Promise<WebhookHandlerResult> {
      const { installation: inst } = payload;

      log(`Installation deleted: ${inst.account.login}`);

      await db
        .update(installations)
        .set({ enabled: false, updatedAt: new Date() })
        .where(eq(installations.githubInstallationId, inst.id));

      return { event: null };
    },

    /**
     * Handles installation_repositories.added events.
     * Creates database records for newly added repositories.
     */
    async onInstallationRepositoriesAdded(
      payload: InstallationRepositoriesPayload
    ): Promise<WebhookHandlerResult> {
      const { installation: inst, repositories_added: reposAdded } = payload;

      log(`${reposAdded.length} repositories added to installation ${inst.account.login}`);

      const dbInstallation = await findOrCreateInstallation(db, {
        githubInstallationId: inst.id,
        accountLogin: inst.account.login,
        accountType: inst.account.type,
      });

      for (const repo of reposAdded) {
        const [owner, name] = repo.full_name.split('/');
        await findOrCreateRepository(db, {
          installationId: dbInstallation.id,
          githubRepoId: repo.id,
          owner,
          name,
        });
      }

      return { event: null };
    },

    /**
     * Handles installation_repositories.removed events.
     * Marks removed repositories as disabled in the database.
     */
    async onInstallationRepositoriesRemoved(
      payload: InstallationRepositoriesPayload
    ): Promise<WebhookHandlerResult> {
      const { repositories_removed: reposRemoved } = payload;

      log(`${reposRemoved.length} repositories removed from installation`);

      for (const repo of reposRemoved) {
        await db
          .update(repositories)
          .set({ enabled: false, updatedAt: new Date() })
          .where(eq(repositories.githubRepoId, repo.id));
      }

      return { event: null };
    },
  };
}

/** Type helper for the return type of createWebhookHandlers. */
export type WebhookHandlers = ReturnType<typeof createWebhookHandlers>;
