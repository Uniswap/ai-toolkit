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
 * This returns paths in priority order:
 * 1. $CLAUDE_CONFIG_DIR/claude.json (if env var is set)
 * 2. ~/.claude.json (legacy location)
 * 3. ~/.claude/claude.json (new default user location)
 *
 * Used for backward compatibility when searching for configuration values
 * like MCP server tokens that may exist in any of these locations.
 */
export function getAllClaudeConfigPaths(): string[] {
  const paths: string[] = [];

  // Priority 1: Custom config dir (if set)
  if (process.env.CLAUDE_CONFIG_DIR) {
    paths.push(path.join(process.env.CLAUDE_CONFIG_DIR, 'claude.json'));
  }

  // Priority 2: Legacy location (~/.claude.json)
  paths.push(path.join(os.homedir(), '.claude.json'));

  // Priority 3: New default user location (~/.claude/claude.json)
  paths.push(path.join(os.homedir(), '.claude', 'claude.json'));

  return paths;
}

/**
 * Check if a custom Claude config directory is being used.
 */
export function isUsingCustomConfigDir(): boolean {
  return !!process.env.CLAUDE_CONFIG_DIR;
}
