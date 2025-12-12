import type { LinearClient } from '@linear/sdk';
import type { UpdateIssueConfig } from './types.js';

/**
 * Update a Linear issue after task completion.
 * - Updates the issue status
 * - Attaches the PR URL as an attachment
 * - Optionally adds a comment
 */
export async function updateIssue(
  client: LinearClient,
  config: UpdateIssueConfig
): Promise<{ success: boolean; statusUpdated: boolean; attachmentAdded: boolean }> {
  const { issueId, status, prUrl, comment } = config;

  let statusUpdated = false;
  let attachmentAdded = false;

  // Get the issue first to find its team and current state
  const issue = await client.issue(issueId);
  if (!issue) {
    throw new Error(`Issue "${issueId}" not found`);
  }

  const team = await issue.team;
  if (!team) {
    throw new Error(`Could not find team for issue "${issueId}"`);
  }

  // Find the target workflow state
  const workflowStates = await team.states();
  const targetState = workflowStates.nodes.find((state) => state.name === status);

  if (!targetState) {
    throw new Error(
      `Workflow state "${status}" not found in team "${team.name}". ` +
        `Available states: ${workflowStates.nodes.map((s) => s.name).join(', ')}`
    );
  }

  // Update the issue status
  const updateResult = await client.updateIssue(issueId, {
    stateId: targetState.id,
  });

  if (!updateResult.success) {
    throw new Error(`Failed to update issue "${issueId}" status to "${status}"`);
  }
  statusUpdated = true;

  // Add PR URL as an attachment if provided
  if (prUrl) {
    // Extract PR number and repo from URL for a nice title
    const prMatch = prUrl.match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);
    const attachmentTitle = prMatch ? `PR #${prMatch[2]}` : 'Pull Request';

    const attachmentResult = await client.createAttachment({
      issueId,
      url: prUrl,
      title: attachmentTitle,
      subtitle: 'Created by Claude Code',
      iconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
    });

    if (!attachmentResult.success) {
      // Log warning but don't fail - attachment is secondary
      console.warn(`Warning: Failed to attach PR URL to issue "${issueId}"`);
    } else {
      attachmentAdded = true;
    }
  }

  // Add a comment if provided
  if (comment) {
    try {
      const commentResult = await client.createComment({
        issueId,
        body: comment,
      });
      if (!commentResult.success) {
        console.warn(`Warning: Failed to add comment to issue "${issueId}"`);
      }
    } catch (error) {
      // Log warning but don't fail - comment is secondary
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Failed to add comment: ${errorMessage}`);
    }
  }

  return { success: true, statusUpdated, attachmentAdded };
}

/**
 * Parse update-issue configuration from CLI arguments
 */
export function parseUpdateIssueConfig(args: {
  issueId?: string;
  'issue-id'?: string;
  status?: string;
  prUrl?: string;
  'pr-url'?: string;
  comment?: string;
}): UpdateIssueConfig {
  const issueId = args.issueId || args['issue-id'];
  const prUrl = args.prUrl || args['pr-url'];

  if (!issueId) {
    throw new Error('--issue-id is required');
  }

  if (!args.status) {
    throw new Error('--status is required');
  }

  return {
    issueId,
    status: args.status,
    prUrl,
    comment: args.comment,
  };
}
