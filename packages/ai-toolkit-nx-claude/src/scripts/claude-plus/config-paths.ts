/**
 * Configuration Path Utilities
 *
 * Shared utilities for determining Claude configuration file paths.
 * Respects the CLAUDE_CONFIG_DIR environment variable when set.
 *
 * This module supports multiple configuration locations for backward compatibility:
 * 1. $CLAUDE_CONFIG_DIR/claude.json (if env var is set)
 * 2. ~/.claude.json (legacy location)
 * 3. ~/.claude/claude.json (new default user location from `claude mcp add --scope user`)
 */

import * as path from 'path';
import * as os from 'os';

/**
 * Get the Claude configuration directory path.
 * Respects the CLAUDE_CONFIG_DIR environment variable if set,
 * otherwise returns the home directory (for backward compatibility with ~/.claude.json)
 */
export function getClaudeConfigDir(): string {
  return process.env.CLAUDE_CONFIG_DIR || os.homedir();
}

/**
 * Get the path to the Claude configuration file.
 *
 * When CLAUDE_CONFIG_DIR is set:
 *   - Returns $CLAUDE_CONFIG_DIR/claude.json
 *
 * When CLAUDE_CONFIG_DIR is not set (backward compatible):
 *   - Returns ~/.claude.json (the original default location)
 */
export function getClaudeConfigPath(): string {
  if (process.env.CLAUDE_CONFIG_DIR) {
    return path.join(process.env.CLAUDE_CONFIG_DIR, 'claude.json');
  }
  // Backward compatible: use ~/.claude.json when env var is not set
  return path.join(os.homedir(), '.claude.json');
}

/**
 * Get all possible Claude configuration file paths for reading.
 *
 * When CLAUDE_CONFIG_DIR is set, returns ONLY that path to avoid
 * cross-profile contamination (e.g., reading a Slack token from
 * a different profile and treating it as valid for the active one).
 *
 * When CLAUDE_CONFIG_DIR is not set, returns legacy paths in priority order:
 * 1. ~/.claude.json (legacy location)
 * 2. ~/.claude/claude.json (new default user location)
 *
 * Used for backward compatibility when searching for configuration values
 * like MCP server tokens that may exist in any of these locations.
 */
export function getAllClaudeConfigPaths(): string[] {
  // When a custom config dir is set, restrict reads to the active profile only.
  // Falling back to other locations could return tokens from a different profile,
  // causing validation to pass while the active profile remains unconfigured.
  if (process.env.CLAUDE_CONFIG_DIR) {
    return [path.join(process.env.CLAUDE_CONFIG_DIR, 'claude.json')];
  }

  // No custom config dir — check legacy locations in priority order
  return [
    path.join(os.homedir(), '.claude.json'),
    path.join(os.homedir(), '.claude', 'claude.json'),
  ];
}

/**
 * Check if a custom Claude config directory is being used.
 */
export function isUsingCustomConfigDir(): boolean {
  return !!process.env.CLAUDE_CONFIG_DIR;
}
