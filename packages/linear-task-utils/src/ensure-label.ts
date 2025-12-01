import type { LinearClient } from '@linear/sdk';
import type { EnsureLabelConfig } from './types.js';
import { DEFAULTS } from './types.js';

/**
 * Ensure a label exists in the specified Linear team.
 * Creates the label if it doesn't exist.
 *
 * @returns The label ID (either existing or newly created)
 */
export async function ensureLabel(
  client: LinearClient,
  config: EnsureLabelConfig
): Promise<{ labelId: string; created: boolean }> {
  const { team, label, color = DEFAULTS.labelColor } = config;

  // First, find the team
  const teams = await client.teams({
    filter: { name: { eq: team } },
  });

  const targetTeam = teams.nodes[0];
  if (!targetTeam) {
    throw new Error(`Team "${team}" not found`);
  }

  // Check if the label already exists in this team
  const existingLabels = await client.issueLabels({
    filter: {
      team: { id: { eq: targetTeam.id } },
      name: { eq: label },
    },
  });

  if (existingLabels.nodes.length > 0) {
    const existingLabel = existingLabels.nodes[0];
    return { labelId: existingLabel.id, created: false };
  }

  // Also check for workspace-level labels (no team filter)
  const workspaceLabels = await client.issueLabels({
    filter: {
      name: { eq: label },
    },
  });

  // Find a workspace label (one without a team)
  // Note: Linear SDK returns Promises for relationships, so we must await them
  for (const labelNode of workspaceLabels.nodes) {
    const labelTeam = await labelNode.team;
    if (labelTeam === null || labelTeam === undefined) {
      return { labelId: labelNode.id, created: false };
    }
  }
  // No workspace-level label found, continue to create one

  // Create the label for this team
  const createResult = await client.createIssueLabel({
    name: label,
    color,
    teamId: targetTeam.id,
    description: 'Issues for autonomous Claude Code processing',
  });

  if (!createResult.success || !createResult.issueLabel) {
    throw new Error(`Failed to create label "${label}"`);
  }

  const newLabel = await createResult.issueLabel;
  return { labelId: newLabel.id, created: true };
}

/**
 * Parse ensure-label configuration from CLI arguments
 */
export function parseEnsureLabelConfig(args: {
  team?: string;
  label?: string;
  color?: string;
}): EnsureLabelConfig {
  return {
    team: args.team || DEFAULTS.team,
    label: args.label || DEFAULTS.label,
    color: args.color || DEFAULTS.labelColor,
  };
}
