import { LinearClient } from '@linear/sdk';
import type { QueryConfig, ProcessedIssue, MatrixOutput } from './types.js';
import { PRIORITY_MAP, PRIORITY_SORT_ORDER, DEFAULTS } from './types.js';

/**
 * Generate a URL-safe slug from a string
 */
function slugify(text: string, maxLength = 50): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, maxLength) // Truncate to max length
    .replace(/-+$/, ''); // Remove trailing hyphens after truncation
}

const TRUNCATION_SUFFIX = '\n\n[Description truncated for workflow. See full issue in Linear.]';

/**
 * Truncate text to a maximum length with ellipsis indicator
 * GitHub Actions has limits on output/matrix sizes, so we truncate large descriptions
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum total length including the truncation suffix (default: 4000)
 * @returns The original text if under maxLength, or truncated text with suffix
 */
export function truncateDescription(text: string, maxLength = 4000): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // Account for suffix length to ensure total output stays within maxLength
  const effectiveMax = maxLength - TRUNCATION_SUFFIX.length;

  // Truncate and add indicator that it was truncated
  const truncated = text.substring(0, effectiveMax);

  // Try to break at a word boundary (look for space in last 20% of text)
  const lastSpace = truncated.lastIndexOf(' ');
  const breakPoint = lastSpace > effectiveMax * 0.8 ? lastSpace : effectiveMax;

  return truncated.substring(0, breakPoint) + TRUNCATION_SUFFIX;
}

/**
 * Generate a branch name from a Linear issue
 * Format: claude/{identifier}-{slug}
 */
function generateBranchName(identifier: string, title: string): string {
  const slug = slugify(title, 40);
  // Handle case where title is all special characters (empty slug)
  return slug ? `claude/${identifier.toLowerCase()}-${slug}` : `claude/${identifier.toLowerCase()}`;
}

/**
 * Query Linear for issues matching the specified criteria
 */
export async function queryIssues(
  client: LinearClient,
  config: QueryConfig
): Promise<MatrixOutput> {
  const { team, label, statuses, max } = config;

  // First, find the team
  const teams = await client.teams({
    filter: { name: { eq: team } },
  });

  const targetTeam = teams.nodes[0];
  if (!targetTeam) {
    throw new Error(`Team "${team}" not found`);
  }

  // Get workflow states for the team to find the status IDs
  const workflowStates = await targetTeam.states();
  const statusIds = workflowStates.nodes
    .filter((state) => statuses.includes(state.name))
    .map((state) => state.id);

  if (statusIds.length === 0) {
    throw new Error(`No matching workflow states found for statuses: ${statuses.join(', ')}`);
  }

  // Query issues with filters
  const issues = await client.issues({
    filter: {
      team: { id: { eq: targetTeam.id } },
      labels: { name: { eq: label } },
      state: { id: { in: statusIds } },
    },
    // Fetch more than needed to allow for sorting
    first: Math.min(max * 3, 50),
  });

  // Process and sort issues by priority
  // Note: issue_description is truncated to prevent GitHub Actions matrix size issues
  const processedIssues: ProcessedIssue[] = issues.nodes.map((issue) => ({
    issue_id: issue.id,
    issue_identifier: issue.identifier,
    issue_title: issue.title,
    issue_description: truncateDescription(issue.description || ''),
    issue_url: issue.url,
    branch_name: generateBranchName(issue.identifier, issue.title),
    priority: issue.priority ?? 0,
    priority_label: PRIORITY_MAP[issue.priority ?? 0] || 'No Priority',
    linear_team: team,
  }));

  // Sort by priority (Urgent first, No Priority last)
  processedIssues.sort((a, b) => {
    const aIndex = PRIORITY_SORT_ORDER.indexOf(a.priority);
    const bIndex = PRIORITY_SORT_ORDER.indexOf(b.priority);
    return aIndex - bIndex;
  });

  // Limit to max issues
  const limitedIssues = processedIssues.slice(0, max);

  return {
    include: limitedIssues,
    count: limitedIssues.length,
  };
}

/**
 * Create a Linear client from environment or provided API key
 */
export function createLinearClient(apiKey?: string): LinearClient {
  const key = apiKey || process.env.LINEAR_API_KEY;
  if (!key) {
    throw new Error('LINEAR_API_KEY is required (via LINEAR_API_KEY env var or --api-key flag)');
  }
  return new LinearClient({ apiKey: key });
}

/**
 * Parse query configuration from CLI arguments
 */
export function parseQueryConfig(args: {
  team?: string;
  label?: string;
  statuses?: string;
  max?: string;
}): QueryConfig {
  // Parse and validate max issues
  let max: number = DEFAULTS.max;
  if (args.max) {
    const parsedMax = parseInt(args.max, 10);
    if (isNaN(parsedMax) || parsedMax < 1) {
      throw new Error(`--max must be a positive integer, got: "${args.max}"`);
    }
    max = parsedMax;
  }

  // Parse and validate statuses
  const statuses = args.statuses
    ? args.statuses
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [...DEFAULTS.statuses];

  if (statuses.length === 0) {
    throw new Error('--statuses must contain at least one non-empty status name');
  }

  return {
    team: args.team || DEFAULTS.team,
    label: args.label || DEFAULTS.label,
    statuses,
    max,
  };
}
