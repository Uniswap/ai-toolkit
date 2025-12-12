import { execSync, spawn } from 'child_process';
import { logger } from '@nx/devkit';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Installation options for notification hooks
 */
export interface InstallOptions {
  backupExisting: boolean;
  verbose: boolean;
  dryRun?: boolean;
}

/**
 * Installation result information
 */
export interface InstallResult {
  success: boolean;
  installedPath: string;
  backupPath?: string;
  error?: string;
  installedFiles?: string[];
}

const ROOT_CLAUDE_DIR = path.join(os.homedir(), '.claude');
const HOOKS_DIR = path.join(ROOT_CLAUDE_DIR, 'hooks');

/**
 * Backup existing hooks configuration
 * @param verbose Show detailed output
 * @returns Backup path if successful, null otherwise
 */
export function backupExistingHooks(verbose = false): string | null {
  if (!fs.existsSync(HOOKS_DIR)) {
    if (verbose) {
      logger.info('No existing hooks to backup');
    }
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(ROOT_CLAUDE_DIR, `hooks-backup-${timestamp}`);

  try {
    if (verbose) {
      logger.info(`📦 Creating backup at: ${backupDir}`);
    }

    // Create backup directory
    fs.mkdirSync(backupDir, { recursive: true });

    // Copy hooks directory
    execSync(`cp -r "${HOOKS_DIR}"/* "${backupDir}"/`, {
      stdio: verbose ? 'inherit' : 'ignore',
    });

    // Backup settings.json if it exists
    const settingsPath = path.join(ROOT_CLAUDE_DIR, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const backupSettingsPath = path.join(backupDir, 'settings.json.backup');
      fs.copyFileSync(settingsPath, backupSettingsPath);
    }

    logger.info(`✅ Backup created at: ${backupDir}`);
    return backupDir;
  } catch (error) {
    logger.error(`❌ Failed to create backup: ${error}`);
    return null;
  }
}

/**
 * Execute the install-global.sh script with user options
 * @param scriptPath Path to the install script
 * @param options Installation options
 * @returns Promise that resolves when installation completes
 */
export async function executeInstallScript(
  scriptPath: string,
  options: InstallOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Let the script use its own defaults - don't send any input

      if (options.dryRun) {
        logger.info('🔍 DRY RUN: Would execute install script with defaults');
        resolve(true);
        return;
      }

      logger.info('🚀 Running hook installation...');

      // Change to the repository directory to run the script
      const repoDir = path.dirname(scriptPath);

      // Use spawn to handle interactive script
      // Pass "1" for sound notification as default
      const child = spawn('bash', [scriptPath], {
        stdio: ['pipe', options.verbose ? 'inherit' : 'pipe', 'inherit'],
        shell: true,
        cwd: repoDir, // Set working directory to the repo directory
      });

      // Send "1" to select sound notifications (default option)
      if (child.stdin) {
        child.stdin.write('1\n');
        child.stdin.end();
      }

      child.on('close', (code) => {
        if (code === 0) {
          logger.info('✅ Installation script completed successfully');
          resolve(true);
        } else {
          logger.error(`❌ Installation script exited with code ${code}`);
          resolve(false);
        }
      });

      child.on('error', (error) => {
        logger.error(`❌ Failed to execute install script: ${error}`);
        resolve(false);
      });
    } catch (error) {
      logger.error(`❌ Error executing install script: ${error}`);
      resolve(false);
    }
  });
}

/**
 * Fix hook paths in settings.json to use ~ expansion for Docker compatibility
 * @param verbose Show detailed output
 * @returns true if successful
 */
function fixHookPaths(verbose = false): boolean {
  const settingsPath = path.join(ROOT_CLAUDE_DIR, 'settings.json');

  if (!fs.existsSync(settingsPath)) {
    if (verbose) {
      logger.warn('⚠️  settings.json not found - cannot fix paths');
    }
    return false;
  }

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

    if (!settings.hooks) {
      if (verbose) {
        logger.warn('⚠️  No hooks configuration found in settings.json');
      }
      return false;
    }

    // Fix paths in all hook configurations to use ~ expansion
    const homeDir = os.homedir();
    let modified = false;

    const fixPathInHooks = (hookArray: any[]) => {
      for (const hookConfig of hookArray) {
        if (hookConfig.hooks && Array.isArray(hookConfig.hooks)) {
          for (const hook of hookConfig.hooks) {
            if (hook.command && typeof hook.command === 'string') {
              // Replace absolute paths with ~ expansion
              if (hook.command.includes(homeDir)) {
                hook.command = hook.command.replace(homeDir, '~');
                modified = true;
              }
              // Also handle any hardcoded /Users/* or /home/* paths
              const pathMatch = hook.command.match(/\/(Users|home)\/[^/]+\/\.claude\/hooks\//);
              if (pathMatch) {
                hook.command = hook.command.replace(pathMatch[0], '~/.claude/hooks/');
                modified = true;
              }
            }
          }
        }
      }
    };

    // Process all hook types
    const hookTypes = ['Notification', 'Stop', 'SubagentStop', 'PreToolUse', 'PostToolUse'];
    for (const hookType of hookTypes) {
      if (settings.hooks[hookType] && Array.isArray(settings.hooks[hookType])) {
        fixPathInHooks(settings.hooks[hookType]);
      }
    }

    if (modified) {
      // Write the updated settings back
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      if (verbose) {
        logger.info('✅ Fixed hook paths to use ~ expansion for Docker compatibility');
      }
      return true;
    }

    return true;
  } catch (error) {
    logger.error(`❌ Failed to fix hook paths: ${error}`);
    return false;
  }
}

/**
 * Verify the installation was successful
 * @returns Array of installed files or null if verification fails
 */
export function verifyInstallation(): string[] | null {
  const expectedFiles = ['notification.ts', 'stop.ts', 'subagent_stop.ts'];

  const installedFiles: string[] = [];
  const missingFiles: string[] = [];

  for (const file of expectedFiles) {
    const filePath = path.join(HOOKS_DIR, file);
    if (fs.existsSync(filePath)) {
      installedFiles.push(filePath);
    } else {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    logger.warn(`⚠️  Missing expected files: ${missingFiles.join(', ')}`);
    return null;
  }

  // Check settings.json for hook configuration
  const settingsPath = path.join(ROOT_CLAUDE_DIR, 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    logger.warn('⚠️  settings.json not found');
    return null;
  }

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    if (!settings.hooks) {
      logger.warn('⚠️  No hooks configuration found in settings.json');
      return null;
    }

    logger.info('✅ Installation verified successfully');
    return installedFiles;
  } catch (error) {
    logger.error(`❌ Failed to verify settings.json: ${error}`);
    return null;
  }
}

/**
 * Main installation orchestrator
 * @param repoPath Path to the cloned repository
 * @param options Installation options
 * @returns Installation result
 */
export async function runInstallation(
  repoPath: string,
  options: InstallOptions
): Promise<InstallResult> {
  const result: InstallResult = {
    success: false,
    installedPath: HOOKS_DIR,
  };

  try {
    // Check if install script exists
    const installScriptPath = path.join(repoPath, 'install-global.sh');
    if (!fs.existsSync(installScriptPath)) {
      throw new Error(`Install script not found at: ${installScriptPath}`);
    }

    // Make script executable
    execSync(`chmod +x "${installScriptPath}"`, { stdio: 'ignore' });

    // Backup existing configuration if requested
    if (options.backupExisting) {
      const backupPath = backupExistingHooks(options.verbose);
      if (backupPath) {
        result.backupPath = backupPath;
      }
    }

    // Execute the installation script
    const installSuccess = await executeInstallScript(
      installScriptPath,
      options
    );
    if (!installSuccess) {
      throw new Error('Installation script failed');
    }

    // Verify installation
    const installedFiles = verifyInstallation();
    if (!installedFiles) {
      throw new Error('Installation verification failed');
    }

    // Fix hook paths to use ~ expansion for Docker compatibility
    fixHookPaths(options.verbose);

    result.success = true;
    result.installedFiles = installedFiles;

    // Log installation summary
    logger.info('\n📋 Installation Summary:');
    logger.info(`  ✅ Hooks installed to: ${result.installedPath}`);
    if (result.backupPath) {
      logger.info(`  ✅ Backup created at: ${result.backupPath}`);
    }
    logger.info(`  ✅ Files installed: ${installedFiles.length}`);

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Installation failed: ${result.error}`);

    // Attempt to restore backup if installation failed
    if (result.backupPath && !options.dryRun) {
      logger.info('🔄 Attempting to restore backup...');
      await restoreBackup(result.backupPath);
    }

    return result;
  }
}

/**
 * Restore hooks from backup
 * @param backupPath Path to the backup directory
 * @returns true if successful
 */
export async function restoreBackup(backupPath: string): Promise<boolean> {
  try {
    // Remove current hooks
    if (fs.existsSync(HOOKS_DIR)) {
      fs.rmSync(HOOKS_DIR, { recursive: true, force: true });
    }

    // Restore from backup
    fs.mkdirSync(HOOKS_DIR, { recursive: true });
    execSync(`cp -r "${backupPath}"/* "${HOOKS_DIR}"/`, {
      stdio: 'ignore',
    });

    // Restore settings.json if it exists in backup
    const backupSettingsPath = path.join(backupPath, 'settings.json.backup');
    if (fs.existsSync(backupSettingsPath)) {
      const settingsPath = path.join(ROOT_CLAUDE_DIR, 'settings.json');
      fs.copyFileSync(backupSettingsPath, settingsPath);
    }

    logger.info('✅ Backup restored successfully');
    return true;
  } catch (error) {
    logger.error(`❌ Failed to restore backup: ${error}`);
    return false;
  }
}

/**
 * Test the installed hooks
 * @returns true if test successful
 */
export async function testHooks(): Promise<boolean> {
  try {
    logger.info('🧪 Testing installed hooks...');

    // Create a test event payload
    const testPayload = {
      hook_event_name: 'Notification',
      session_id: 'test-session',
      timestamp: new Date().toISOString(),
      cwd: process.cwd(),
    };

    const notificationHook = path.join(HOOKS_DIR, 'notification.ts');

    if (!fs.existsSync(notificationHook)) {
      logger.error('❌ Notification hook not found');
      return false;
    }

    // Execute the hook with test payload
    const command = `echo '${JSON.stringify(
      testPayload
    )}' | npx tsx "${notificationHook}" --notify`;

    logger.info('🔔 Triggering test notification...');
    execSync(command, { stdio: 'inherit' });

    logger.info('✅ Hook test completed successfully');
    logger.info('You should have heard a notification sound/speech');

    return true;
  } catch (error) {
    logger.error(`❌ Hook test failed: ${error}`);
    return false;
  }
}
