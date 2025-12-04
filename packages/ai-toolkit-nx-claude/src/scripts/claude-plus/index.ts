#!/usr/bin/env node

/**
 * claude-plus - Enhanced Claude Code launcher
 *
 * This script provides a streamlined startup experience for Claude Code by:
 * 1. Running the MCP server selector (via claude-mcp-helper)
 * 2. Validating and refreshing Slack OAuth tokens if needed
 * 3. Launching Claude Code
 *
 * Usage:
 *   npx @uniswap/ai-toolkit-nx-claude:claude-plus
 *
 * Environment Variables:
 *   SLACK_CLIENT_ID     - Slack OAuth client ID
 *   SLACK_CLIENT_SECRET - Slack OAuth client secret
 *   SLACK_REFRESH_TOKEN - Slack OAuth refresh token
 *
 * Configuration:
 *   ~/.claude.json - Claude Code configuration file
 *   ~/.config/claude-code/slack-env.sh - Slack environment variables
 */

import { runMcpSelector } from './mcp-selector';
import { validateAndRefreshSlackToken } from './slack-token';
import { launchClaude } from './claude-launcher';
import { displayHeader, displaySuccess, displayInfo, displayError } from './display';

interface ClaudePlusOptions {
  skipMcp?: boolean;
  skipSlack?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

function parseArgs(args: string[]): ClaudePlusOptions {
  const options: ClaudePlusOptions = {};

  for (const arg of args) {
    switch (arg) {
      case '--skip-mcp':
        options.skipMcp = true;
        break;
      case '--skip-slack':
        options.skipSlack = true;
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
  }

  return options;
}

function displayHelp(): void {
  console.log(`
claude-plus - Enhanced Claude Code launcher

Usage:
  npx @uniswap/ai-toolkit-nx-claude:claude-plus [options]

Options:
  --skip-mcp     Skip the MCP server selector
  --skip-slack   Skip Slack token validation/refresh
  --dry-run      Show what would be done without executing
  --verbose, -v  Show detailed output
  --help, -h     Show this help message

Description:
  This tool enhances the Claude Code startup experience by:
  1. Running the MCP server selector to choose which MCP servers to enable
  2. Validating your Slack OAuth token and refreshing it if expired
  3. Launching Claude Code with your configured settings

Environment Variables:
  SLACK_CLIENT_ID     - Slack OAuth client ID (required for token refresh)
  SLACK_CLIENT_SECRET - Slack OAuth client secret (required for token refresh)
  SLACK_REFRESH_TOKEN - Slack OAuth refresh token (required for token refresh)

Configuration Files:
  ~/.claude.json                      - Claude Code configuration
  ~/.config/claude-code/slack-env.sh  - Slack environment variables

Examples:
  # Full startup flow
  npx @uniswap/ai-toolkit-nx-claude:claude-plus

  # Skip MCP selection (use existing config)
  npx @uniswap/ai-toolkit-nx-claude:claude-plus --skip-mcp

  # Skip Slack token refresh
  npx @uniswap/ai-toolkit-nx-claude:claude-plus --skip-slack

  # Preview what would happen
  npx @uniswap/ai-toolkit-nx-claude:claude-plus --dry-run
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  displayHeader();

  try {
    // Step 1: MCP Server Selection
    if (!options.skipMcp) {
      displayInfo('\n[1/3] MCP Server Selection');
      if (options.dryRun) {
        displayInfo('  Would run: claude-mcp-helper interactive');
      } else {
        await runMcpSelector(options.verbose);
      }
    } else {
      displayInfo('\n[1/3] MCP Server Selection (skipped)');
    }

    // Step 2: Slack Token Validation
    if (!options.skipSlack) {
      displayInfo('\n[2/3] Slack Token Validation');
      if (options.dryRun) {
        displayInfo('  Would validate Slack token and refresh if needed');
      } else {
        await validateAndRefreshSlackToken(options.verbose);
      }
    } else {
      displayInfo('\n[2/3] Slack Token Validation (skipped)');
    }

    // Step 3: Launch Claude
    displayInfo('\n[3/3] Launching Claude Code');
    if (options.dryRun) {
      displayInfo('  Would run: claude');
      displaySuccess('\nDry run complete - no changes made');
    } else {
      displaySuccess('\nStarting Claude Code...\n');
      await launchClaude();
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    displayError(`\nError: ${errorMessage}`);
    process.exit(1);
  }
}

main();
