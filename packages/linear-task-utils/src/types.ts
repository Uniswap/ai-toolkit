/**
 * Configuration for querying Linear issues
 */
export interface QueryConfig {
  /** Linear team name to query */
  team: string;
  /** Label name to filter by */
  label: string;
  /** Workflow state names to filter by (e.g., ["Backlog", "Todo"]) */
  statuses: string[];
  /** Maximum number of issues to return */
  max: number;
}

/**
 * Configuration for ensuring a label exists
 */
export interface EnsureLabelConfig {
  /** Linear team name */
  team: string;
  /** Label name to ensure exists */
  label: string;
  /** Optional color for the label (hex code) */
  color?: string;
}

/**
 * Configuration for updating an issue after task completion
 */
export interface UpdateIssueConfig {
  /** Linear issue ID */
  issueId: string;
  /** New status name (e.g., "In Review") */
  status: string;
  /** PR URL to attach to the issue */
  prUrl?: string;
  /** Optional comment to add to the issue */
  comment?: string;
}

/**
 * Processed issue ready for GitHub Actions matrix
 */
export interface ProcessedIssue {
  /** Linear issue ID (UUID) */
  issue_id: string;
  /** Linear issue identifier (e.g., "DAI-123") */
  issue_identifier: string;
  /** Issue title */
  issue_title: string;
  /** Full issue description (markdown) */
  issue_description: string;
  /** Linear issue URL */
  issue_url: string;
  /** Generated branch name (e.g., "claude/DAI-123-fix-bug") */
  branch_name: string;
  /** Priority number (1=Urgent, 2=High, 3=Normal, 4=Low, 0=No Priority) */
  priority: number;
  /** Human-readable priority label */
  priority_label: string;
  /** Linear team name (for multi-team support) */
  linear_team: string;
}

/**
 * Output format for GitHub Actions matrix strategy
 */
export interface MatrixOutput {
  /** Array of issues to include in the matrix */
  include: ProcessedIssue[];
  /** Total count of issues */
  count: number;
}

/**
 * Priority mapping from Linear's numeric values to labels
 */
export const PRIORITY_MAP: Record<number, string> = {
  1: 'Urgent',
  2: 'High',
  3: 'Normal',
  4: 'Low',
  0: 'No Priority',
};

/**
 * Priority sort order (lower index = higher priority)
 * Urgent (1) > High (2) > Normal (3) > Low (4) > No Priority (0)
 */
export const PRIORITY_SORT_ORDER: number[] = [1, 2, 3, 4, 0];

/**
 * Default configuration values
 */
export const DEFAULTS = {
  team: 'Developer AI',
  label: 'claude',
  statuses: ['Backlog', 'Todo'],
  max: 3,
  labelColor: '#6366f1', // Indigo color for Claude label
} as const;
