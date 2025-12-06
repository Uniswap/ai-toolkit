/**
 * MCP Server Selector
 *
 * Runs the claude-mcp-helper interactive mode to allow users to select
 * which MCP servers to enable/disable before starting Claude.
 */

import { spawn } from 'child_process';
import { displaySuccess, displayWarning, displayDebug } from './display';

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
    // Use full command string with shell: true to avoid issues with @ in package name
    const child = spawn('npx -y @uniswap/ai-toolkit-claude-mcp-helper@latest interactive', [], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', (error) => {
      // If npx fails, try running directly (in case it's installed globally)
      displayDebug(`npx failed: ${error.message}, trying direct execution...`, verbose);

      const directChild = spawn('claude-mcp-helper', ['interactive'], {
        stdio: 'inherit',
        shell: true,
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
