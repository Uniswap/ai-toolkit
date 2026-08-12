#!/usr/bin/env node

/**
 * claude-plus - Enhanced Claude Code launcher
 *
 * This script provides a streamlined startup experience for Claude Code by:
 * 1. Running the MCP server selector (via claude-mcp-helper)
 * 2. Launching Claude Code
 *
 * Usage:
 *   npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus
 *
 * Environment Variables:
 *   CLAUDE_CONFIG_DIR - Custom Claude configuration directory (default: ~/.claude)
 *
 * Configuration:
 *   $CLAUDE_CONFIG_DIR/claude.json - Claude Code configuration file (default: ~/.claude.json)
 */

import { runMcpSelector } from './mcp-selector';
import { launchClaude } from './claude-launcher';
import { findLegacySlackTokenConfigs, warnAboutLegacySlackToken } from './legacy-slack';
import {
  displayHeader,
  displaySuccess,
  displayInfo,
  displayError,
  displayWarning,
} from './display';

// claude-plus specific flags that should NOT be passed to claude
const CLAUDE_PLUS_FLAGS = new Set(['--skip-mcp', '--dry-run', '--verbose', '-v', '--help', '-h']);

// Slack setup moved to the official hosted MCP server (`/mcp` -> slack). These
// flags no longer do anything, but must not reach the claude binary.
const REMOVED_SLACK_FLAGS = new Set(['--skip-slack', '--setup-slack']);

interface ClaudePlusOptions {
  skipMcp?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  removedSlackFlags: string[]; // Accepted for compatibility, warned about, then ignored
  claudeArgs: string[]; // Arguments to pass through to claude
}

function warnRemovedSlackFlag(flag: string): void {
  displayWarning(
    `${flag} is no longer supported. Slack is now an OAuth MCP server:\n` +
      `  run /mcp inside Claude Code and connect "slack".\n`
  );
}

function parseArgs(args: string[]): ClaudePlusOptions {
  const options: ClaudePlusOptions = {
    removedSlackFlags: [],
    claudeArgs: [],
  };

  for (const arg of args) {
    // Swallowed, not passed through: the claude binary would reject them as
    // unknown. Warned about after the header so the notice sits with the steps.
    if (REMOVED_SLACK_FLAGS.has(arg)) {
      if (!options.removedSlackFlags.includes(arg)) {
        options.removedSlackFlags.push(arg);
      }
      continue;
    }

    // Check if this is a claude-plus specific flag
    if (CLAUDE_PLUS_FLAGS.has(arg)) {
      switch (arg) {
        case '--skip-mcp':
          options.skipMcp = true;
          break;
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        case '--help':
        case '-h':
          displayHelp();
          process.exit(0);
      }
    } else {
      // Pass through any unrecognized arguments to claude
      options.claudeArgs.push(arg);
    }
  }

  return options;
}

function displayHelp(): void {
  console.log(`
claude-plus - Enhanced Claude Code launcher

Usage:
  npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus [options] [-- claude-args...]

Options:
  --skip-mcp     Skip the MCP server selector
  --dry-run      Show what would be done without executing
  --verbose, -v  Show detailed output
  --help, -h     Show this help message

  Any unrecognized options are passed through to the claude command.

Description:
  This tool enhances the Claude Code startup experience by:
  1. Running the MCP server selector to choose which MCP servers to enable
  2. Launching Claude Code with your configured settings

Slack:
  claude-plus no longer manages Slack tokens. Slack is now an OAuth MCP
  server: run /mcp inside Claude Code, pick "slack", and complete the
  browser flow. The --skip-slack and --setup-slack flags are accepted but
  do nothing.

Environment Variables:
  CLAUDE_CONFIG_DIR - Custom Claude configuration directory (default: ~/.claude)

Configuration Files:
  $CLAUDE_CONFIG_DIR/claude.json - Claude Code configuration (default: ~/.claude.json)

Examples:
  # Full startup flow
  npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus

  # Skip MCP selection (use existing config)
  npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus --skip-mcp

  # Preview what would happen
  npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus --dry-run

  # Pass arguments to claude (e.g., resume previous session)
  npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus --resume

  # Combine claude-plus flags with claude flags
  npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus --skip-mcp --resume
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  displayHeader();
  options.removedSlackFlags.forEach(warnRemovedSlackFlag);

  // Surfaced on every launch, not just when a removed flag is passed: upgrading
  // does not clear an entry an older version wrote, and the user has no other
  // signal that their Slack tools are broken.
  const legacyConfigs = findLegacySlackTokenConfigs(options.verbose);
  if (legacyConfigs.length > 0) {
    warnAboutLegacySlackToken(legacyConfigs);
  }

  try {
    // Step 1: MCP Server Selection
    if (!options.skipMcp) {
      displayInfo('\n[1/2] MCP Server Selection');
      if (options.dryRun) {
        displayInfo('  Would run: claude-mcp-helper interactive');
      } else {
        await runMcpSelector(options.verbose);
      }
    } else {
      displayInfo('\n[1/2] MCP Server Selection (skipped)');
    }

    // Step 2: Launch Claude
    displayInfo('\n[2/2] Launching Claude Code');
    if (options.dryRun) {
      const claudeCmd =
        options.claudeArgs.length > 0 ? `claude ${options.claudeArgs.join(' ')}` : 'claude';
      displayInfo(`  Would run: ${claudeCmd}`);
      displaySuccess('\nDry run complete - no changes made');
    } else {
      if (options.claudeArgs.length > 0) {
        displaySuccess(`\nStarting Claude Code with args: ${options.claudeArgs.join(' ')}\n`);
      } else {
        displaySuccess('\nStarting Claude Code...\n');
      }
      await launchClaude(options.claudeArgs);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    displayError(`\nError: ${errorMessage}`);
    process.exit(1);
  }
}

main();
