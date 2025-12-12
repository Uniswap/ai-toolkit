/**
 * Claude Code Launcher
 *
 * Launches Claude Code, replacing the current process so that
 * Claude becomes the foreground application.
 */

import { spawn } from 'child_process';
import { displayError, displayWarning } from './display';

/**
 * Launch Claude Code
 *
 * This spawns claude as a child process with stdio inherited,
 * effectively handing over control to Claude.
 *
 * @param args - Arguments to pass through to the claude command
 */
export async function launchClaude(args: string[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    // Spawn claude with inherited stdio so it takes over the terminal
    const child = spawn('claude', args, {
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', (error) => {
      displayError('Failed to launch Claude');
      displayWarning('Make sure Claude Code is installed:');
      displayWarning('  curl -fsSL https://claude.ai/install.sh | sh');
      displayWarning('  or');
      displayWarning('  npm install -g @anthropic-ai/claude-code');
      reject(new Error(`Failed to launch Claude: ${error.message}`));
    });

    child.on('close', (code) => {
      // Claude has exited
      if (code === 0) {
        resolve();
      } else {
        // Non-zero exit from Claude is fine - user may have quit
        resolve();
      }
    });
  });
}
