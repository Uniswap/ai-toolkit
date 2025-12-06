/**
 * MCP Server Selector
 *
 * Runs the claude-mcp-helper interactive mode to allow users to select
 * which MCP servers to enable/disable before starting Claude.
 */

import { spawn } from 'child_process';
import { displaySuccess, displayWarning, displayDebug } from './display';

/**
 * Creates a clean environment for spawning child npx processes.
 *
 * When this script is invoked via `npx -p <package> <binary>`, npx sets
 * npm_config_package to the parent package path. This environment variable
 * confuses child npx processes and causes them to fail with errors like:
 * "sh: @package/name: No such file or directory"
 *
 * By removing npm_config_package, we allow child npx processes to work correctly.
 */
function getCleanEnvForNpx(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.npm_config_package;
  return env;
}

/**
 * Run the MCP server selector using claude-mcp-helper
 *
 * This spawns the claude-mcp-helper interactive mode which presents
 * a multi-select interface for managing MCP servers.
 */
export async function runMcpSelector(verbose?: boolean): Promise<void> {
  return new Promise((resolve) => {
    displayDebug('Running claude-mcp-helper interactive mode...', verbose);

    // Try to run claude-mcp-helper via npx
    // Use clean environment to avoid npm_config_package interference
    const child = spawn(
      'npx',
      ['-y', '@uniswap/ai-toolkit-claude-mcp-helper@latest', 'interactive'],
      {
        stdio: 'inherit',
        env: getCleanEnvForNpx(),
      }
    );

    child.on('error', (error) => {
      // If npx fails, try running directly (in case it's installed globally)
      displayDebug(`npx failed: ${error.message}, trying direct execution...`, verbose);

      const directChild = spawn('claude-mcp-helper', ['interactive'], {
        stdio: 'inherit',
      });

      directChild.on('error', () => {
        displayWarning('claude-mcp-helper not found. Skipping MCP selection.');
        displayWarning('Install with: npm install -g @uniswap/ai-toolkit-claude-mcp-helper');
        resolve(); // Don't fail, just continue
      });

      directChild.on('close', (code) => {
        if (code === 0) {
          displaySuccess('MCP server selection complete');
          resolve();
        } else {
          // Non-zero exit is fine - user may have cancelled
          displayDebug(`MCP selector exited with code ${code}`, verbose);
          resolve();
        }
      });
    });

    child.on('close', (code) => {
      if (code === 0) {
        displaySuccess('MCP server selection complete');
        resolve();
      } else {
        // Non-zero exit is fine - user may have cancelled
        displayDebug(`MCP selector exited with code ${code}`, verbose);
        resolve();
      }
    });
  });
}
