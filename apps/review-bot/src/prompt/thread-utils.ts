/**
 * Thread Restructuring Utilities
 *
 * Transforms flat comment lists from the GitHub API into threaded structures
 * with computed metadata about discussion activity. This helps Claude make
 * better decisions about thread resolution during re-reviews.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Raw comment structure from GitHub API (flat list).
 */
export interface RawComment {
  id: number;
  path: string;
  line: number | null;
  body: string;
  user: string;
  in_reply_to_id: number | null;
  created_at: string;
}

/**
 * Reply within a comment thread.
 */
export interface CommentReply {
  id: number;
  body: string;
  user: string;
  created_at: string;
}

/**
 * Threaded comment structure with replies grouped and discussion metadata.
 */
export interface ThreadedComment {
  id: number;
  path: string;
  line: number | null;
  body: string;
  user: string;
  created_at: string;
  reply_count: number;
  has_active_discussion: boolean;
  replies: CommentReply[];
}

// =============================================================================
// Bot Detection
// =============================================================================

/**
 * Common bot username patterns to exclude from discussion detection.
 * These are automated accounts whose replies don't indicate human deliberation.
 */
const BOT_PATTERNS: RegExp[] = [
  /\[bot\]$/i, // GitHub Apps: dependabot[bot], renovate[bot]
  /-bot$/i, // Convention: my-team-bot
  /^github-actions$/i, // GitHub Actions bot
  /^dependabot$/i, // Dependabot (older format)
  /^renovate$/i, // Renovate bot
  /^codecov$/i, // Codecov bot
  /^sonarcloud$/i, // SonarCloud bot
  /^vercel$/i, // Vercel bot
];

/**
 * Checks if a username appears to be a bot account.
 *
 * @param username - GitHub username to check
 * @returns true if the username matches known bot patterns
 */
export function isBot(username: string): boolean {
  return BOT_PATTERNS.some((pattern) => pattern.test(username));
}

// =============================================================================
// Thread Analysis
// =============================================================================

/**
 * Filters out bot replies from a list of replies.
 *
 * @param replies - Array of replies to filter
 * @returns Array of replies from human users only
 */
export function filterBotReplies(replies: CommentReply[]): CommentReply[] {
  return replies.filter((reply) => !isBot(reply.user));
}

/**
 * Checks if replies represent genuine back-and-forth discussion.
 *
 * A genuine discussion requires at least 2 different human participants
 * engaging in the thread. Multiple replies from the same person don't
 * count as discussion - they might just be adding context or corrections.
 *
 * @param replies - Array of human (non-bot) replies
 * @param originalCommenter - User who made the original comment
 * @returns true if there's genuine multi-party discussion
 */
export function hasGenuineBackAndForth(
  replies: CommentReply[],
  originalCommenter: string
): boolean {
  const participants = new Set<string>([originalCommenter]);

  for (const reply of replies) {
    participants.add(reply.user);
  }

  // Genuine discussion requires at least 2 different humans talking
  return participants.size >= 2;
}

/**
 * Determines if a thread has active discussion that shouldn't be auto-resolved.
 *
 * Heuristics (after filtering out bots):
 * - If the last reply is from someone other than the original commenter,
 *   it suggests they're waiting for a response
 * - If there are 2+ human replies with genuine back-and-forth (multiple
 *   participants), it indicates active discussion
 *
 * Excludes from "active discussion":
 * - Bot replies (dependabot, github-actions, etc.)
 * - Multiple replies from only the same person (no real discussion)
 *
 * @param replies - Array of replies in the thread
 * @param originalCommenter - User who made the original comment
 * @returns true if the thread appears to have active human discussion
 */
export function hasActiveDiscussion(replies: CommentReply[], originalCommenter: string): boolean {
  // Filter out bot replies - they don't indicate human deliberation
  const humanReplies = filterBotReplies(replies);

  // No human replies = no active discussion
  if (humanReplies.length === 0) {
    return false;
  }

  // Check if the last human reply is from someone other than the original commenter.
  // This means someone is waiting for a response.
  const lastHumanReply = humanReplies[humanReplies.length - 1];
  if (lastHumanReply.user !== originalCommenter) {
    return true;
  }

  // 2+ human replies: check if there's genuine back-and-forth
  // (multiple participants, not just one person adding follow-ups)
  if (humanReplies.length >= 2 && hasGenuineBackAndForth(humanReplies, originalCommenter)) {
    return true;
  }

  return false;
}

// =============================================================================
// Thread Restructuring
// =============================================================================

/**
 * Restructures a flat list of comments into a threaded structure.
 *
 * Takes the raw GitHub API response (flat list with in_reply_to_id) and groups
 * comments into threads with their replies. Adds computed fields:
 * - reply_count: Number of replies to this comment
 * - has_active_discussion: Whether the thread has active back-and-forth
 * - replies: Array of reply objects
 *
 * @param rawComments - Flat list of comments from GitHub API
 * @returns Array of threaded comments (root comments with replies attached)
 */
export function restructureCommentsIntoThreads(rawComments: RawComment[]): ThreadedComment[] {
  // Separate root comments from replies
  const rootComments: RawComment[] = [];
  const repliesByParent = new Map<number, RawComment[]>();

  for (const comment of rawComments) {
    if (comment.in_reply_to_id === null) {
      rootComments.push(comment);
    } else {
      const parentId = comment.in_reply_to_id;
      let parentReplies = repliesByParent.get(parentId);
      if (parentReplies === undefined) {
        parentReplies = [];
        repliesByParent.set(parentId, parentReplies);
      }
      parentReplies.push(comment);
    }
  }

  // Build threaded structure
  return rootComments.map((root) => {
    const replies = repliesByParent.get(root.id) ?? [];
    const replyObjects: CommentReply[] = replies.map((r) => ({
      id: r.id,
      body: r.body,
      user: r.user,
      created_at: r.created_at,
    }));

    return {
      id: root.id,
      path: root.path,
      line: root.line,
      body: root.body,
      user: root.user,
      created_at: root.created_at,
      reply_count: replyObjects.length,
      has_active_discussion: hasActiveDiscussion(replyObjects, root.user),
      replies: replyObjects,
    };
  });
}
