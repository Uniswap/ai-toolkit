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
 *   npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus
 *
 * Environment Variables:
 *   CLAUDE_CONFIG_DIR   - Custom Claude configuration directory (default: ~/.claude)
 *   SLACK_REFRESH_URL   - Backend URL for token refresh (default: https://ai-toolkit-slack-oauth-backend.vercel.app)
 *   SLACK_REFRESH_TOKEN - Slack OAuth refresh token
 *
 * Configuration:
 *   $CLAUDE_CONFIG_DIR/claude.json - Claude Code configuration file (default: ~/.claude.json)
 *   ~/.config/claude-code/slack-env.sh - Slack environment variables
 */

import { runMcpSelector } from './mcp-selector';
import { validateAndRefreshSlackToken } from './slack-token';
import { launchClaude } from './claude-launcher';
import { displayHeader, displaySuccess, displayInfo, displayError } from './display';
import { runSlackSetupWizard } from './slack-setup';

// claude-plus specific flags that should NOT be passed to claude
const CLAUDE_PLUS_FLAGS = new Set([
  '--skip-mcp',
  '--skip-slack',
  '--setup-slack',
  '--dry-run',
  '--verbose',
  '-v',
  '--help',
  '-h',
]);

interface ClaudePlusOptions {
  skipMcp?: boolean;
  skipSlack?: boolean;
  setupSlack?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  claudeArgs: string[]; // Arguments to pass through to claude
}

function parseArgs(args: string[]): ClaudePlusOptions {
  const options: ClaudePlusOptions = {
    claudeArgs: [],
  };

  for (const arg of args) {
    // Check if this is a claude-plus specific flag
    if (CLAUDE_PLUS_FLAGS.has(arg)) {
      switch (arg) {
        case '--skip-mcp':
          options.skipMcp = true;
          break;
        case '--skip-slack':
          options.skipSlack = true;
          break;
        case '--setup-slack':
          options.setupSlack = true;
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
  --skip-slack   Skip Slack token validation/refresh
  --setup-slack  Run the Slack OAuth setup wizard (create/update credentials)
  --dry-run      Show what would be done without executing
  --verbose, -v  Show detailed output
  --help, -h     Show this help message

  Any unrecognized options are passed through to the claude command.

Description:
  This tool enhances the Claude Code startup experience by:
  1. Running the MCP server selector to choose which MCP servers to enable
  2. Validating your Slack OAuth token and refreshing it if expired
  3. Launching Claude Code with your configured settings

  On first run, if Slack credentials are not configured, you'll be prompted
  to set them up interactively. You can also run --setup-slack to configure
  or update credentials at any time.

Slack Setup:
  To obtain your Slack tokens, visit:
    https://ai-toolkit-slack-oauth-backend.vercel.app/

  1. Click "Add to Slack" and authorize the app
  2. Copy the Access Token (xoxp-...) and Refresh Token (xoxe-1-...)
  3. Run --setup-slack and enter your tokens when prompted

Environment Variables:
  CLAUDE_CONFIG_DIR   - Custom Claude configuration directory (default: ~/.claude)
  SLACK_REFRESH_URL   - Backend URL for token refresh (default: https://ai-toolkit-slack-oauth-backend.vercel.app)
  SLACK_REFRESH_TOKEN - Slack OAuth refresh token (required for token refresh)

Configuration Files:
  $CLAUDE_CONFIG_DIR/claude.json      - Claude Code configuration (default: ~/.claude.json)
  ~/.config/claude-code/slack-env.sh  - Slack environment variables (auto-created)

Examples:
  # Full startup flow (prompts for Slack setup if needed)
  npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus

  # Configure or update Slack credentials
  npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus --setup-slack

  # Skip MCP selection (use existing config)
  npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus --skip-mcp

  # Skip Slack token refresh
  npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus --skip-slack

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

  try {
    // Handle explicit --setup-slack flag
    if (options.setupSlack) {
      displayInfo('\nRunning Slack OAuth Setup Wizard...');
      if (options.dryRun) {
        displayInfo('  Would run interactive Slack setup wizard');
        displaySuccess('\nDry run complete - no changes made');
        return;
      }
      await runSlackSetupWizard(options.verbose);
      displaySuccess('\nSlack setup complete!');
      displayInfo('Run claude-plus again to start Claude with your new configuration.\n');
      return;
    }

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
