import type { Tree } from '@nx/devkit';
import { formatFiles, logger, writeJson } from '@nx/devkit';
import { prompt } from 'enquirer';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';
import type { InitGeneratorSchema } from './schema';
import { promptForMissingOptions } from '../../utils/prompt-utils';
import {
  getExplicitlyProvidedOptions,
  isNxNoInteractiveProvided,
  isNxDryRunProvided,
} from '../hooks/cli-parser';
import {
  detectShell,
  getCurrentToolkitVersion,
  installUpdateChecker,
} from '../../utils/auto-update-utils';

// Import available commands and agents from content packages
import { commands as agnosticCommands } from '@ai-toolkit/commands-agnostic';
import { agents as agnosticAgents } from '@ai-toolkit/agents-agnostic';
import { addonsGenerator, hooksGenerator } from '../../index';

// Recommended default commands for most users
const DEFAULT_COMMANDS = [
  'explore',
  'plan',
  'review-plan',
  'execute-plan',
  'address-pr-issues',
];

// Recommended default agents for most users
const DEFAULT_AGENTS = [
  'context-loader',
  'planner',
  'plan-reviewer',
  'test-writer',
  'doc-writer',
  'pr-reviewer',
];

interface Manifest {
  version: string;
  installedAt: string;
  commands: string[];
  agents: string[];
  files: string[];
}

function checkExistingFiles(
  targetDir: string,
  subDir: 'commands' | 'agents',
  items: string[]
): Set<string> {
  const existing = new Set<string>();
  const dir = path.join(targetDir, subDir);

  for (const item of items) {
    const filePath = path.join(dir, `${item}.md`);
    if (fs.existsSync(filePath)) {
      existing.add(item);
    }
  }

  return existing;
}

export async function initGenerator(tree: Tree, options: InitGeneratorSchema) {
  // Get explicitly provided CLI options
  const explicitlyProvided = getExplicitlyProvidedOptions();

  // Check if Nx's dry-run flag was provided in any form
  const nxDryRunProvided = isNxDryRunProvided();

  // If Nx dry-run was provided, set our dry option to true
  if (nxDryRunProvided) {
    options.dry = true;
    // Also mark it as explicitly provided
    explicitlyProvided.set('dry', true);
  }

  // Check if Nx's no-interactive flag was provided
  const nxNoInteractiveProvided = isNxNoInteractiveProvided();

  // Step 1: Check if Claude CLI is installed
  let isDryRun = options.dry; // Will be updated after prompting

  if (!nxNoInteractiveProvided && !options.nonInteractive && !isDryRun) {
    const isClaudeInstalled = checkClaudeInstalled();
    if (!isClaudeInstalled) {
      logger.warn('⚠️  Claude CLI is not installed');
      const shouldInstall = await promptInstallClaude();
      if (shouldInstall) {
        await installClaude();
      }
    } else {
      logger.info('✅ Claude CLI is installed');
    }
  } else if (isDryRun && !checkClaudeInstalled()) {
    logger.info('🔍 DRY RUN: Claude CLI is not installed');
    logger.info('Would attempt installation in this order:');
    logger.info('  1. curl -fsSL https://claude.ai/install.sh | bash');
    logger.info(
      '  2. npm install -g @anthropic-ai/claude-code (if curl fails)'
    );
    logger.info('  3. Manual instructions (if both fail)');
  }

  // Determine install mode (default or custom)
  const installMode = options.installMode;

  // Apply defaults for "default" mode
  if (installMode === 'default') {
    logger.info('📦 Default Installation Mode');
    logger.info(
      '   Installing recommended setup with pre-selected components\n'
    );

    // Set all default mode options
    options.installMode = 'default'; // Explicitly set to ensure it's in options
    options.installationType = 'global';
    options.commands = DEFAULT_COMMANDS;
    options.agents = DEFAULT_AGENTS;
    options.installCommands = true;
    options.installAgents = true;
    options.installHooks = true; // Auto-install hooks in default mode
    options.hooksMode = 'sound'; // Use sound notifications
    options.installAddons = true; // Install all MCPs in default mode
    options.dry = false; // Default mode never runs in dry-run

    logger.info('📍 Location: Global (~/.claude)');
    logger.info(`📝 Commands: ${DEFAULT_COMMANDS.length} pre-selected`);
    logger.info(`🤖 Agents: ${DEFAULT_AGENTS.length} pre-selected`);
    logger.info(`🔌 MCPs: All recommended servers will be installed\n`);

    // Mark all default mode options as explicitly provided to skip prompts
    // This includes installMode itself to ensure prompt-when conditions work correctly
    explicitlyProvided.set('installMode', 'default');
    explicitlyProvided.set('installationType', 'global');
    explicitlyProvided.set('installCommands', true);
    explicitlyProvided.set('installAgents', true);
    explicitlyProvided.set('installHooks', true);
    explicitlyProvided.set('hooksMode', 'sound');
    explicitlyProvided.set('installAddons', true);
    explicitlyProvided.set('dry', false);
    explicitlyProvided.set('commands', DEFAULT_COMMANDS);
    explicitlyProvided.set('agents', DEFAULT_AGENTS);
  }

  // Handle interactive mode with schema-driven prompts
  const schemaPath = path.join(__dirname, 'schema.json');

  // Extract command and agent descriptions from the new structure
  const commandDescriptions = Object.fromEntries(
    Object.entries(agnosticCommands).map(([key, value]) => [
      key,
      value.description,
    ])
  );
  const agentDescriptions = Object.fromEntries(
    Object.entries(agnosticAgents).map(([key, value]) => [
      key,
      value.description,
    ])
  );

  // Define directory paths
  const homeDir = os.homedir();
  const globalDir = path.join(homeDir, '.claude');
  const localDir = path.join(process.cwd(), '.claude');

  // Check for existing files in BOTH locations upfront
  // This is needed to show cross-location indicators
  const globalExistingCommands = checkExistingFiles(
    globalDir,
    'commands',
    Object.keys(agnosticCommands)
  );
  const globalExistingAgents = checkExistingFiles(
    globalDir,
    'agents',
    Object.keys(agnosticAgents)
  );
  const localExistingCommands = checkExistingFiles(
    localDir,
    'commands',
    Object.keys(agnosticCommands)
  );
  const localExistingAgents = checkExistingFiles(
    localDir,
    'agents',
    Object.keys(agnosticAgents)
  );

  // Pass the no-interactive flag to prompt-utils via options
  const optionsWithNoInteractive = {
    ...options,
    'no-interactive': nxNoInteractiveProvided || options.nonInteractive,
  };

  let normalizedOptions;
  try {
    normalizedOptions = await promptForMissingOptions(
      optionsWithNoInteractive,
      schemaPath,
      {
        availableCommands: Object.keys(agnosticCommands),
        availableAgents: Object.keys(agnosticAgents),
        commandDescriptions,
        agentDescriptions,
        globalExistingCommands,
        globalExistingAgents,
        localExistingCommands,
        localExistingAgents,
        defaultCommands: DEFAULT_COMMANDS,
        defaultAgents: DEFAULT_AGENTS,
      },
      explicitlyProvided
    );
  } catch (error: any) {
    if (error.message?.includes('Installation cancelled')) {
      logger.warn(`❌ ${error.message}`);
      return;
    }
    throw error;
  }

  // Update isDryRun with the user's selection from prompts
  isDryRun = normalizedOptions.dry || false;

  // Handle dry-run mode
  if (isDryRun) {
    logger.info('🔍 DRY RUN MODE - No files will be modified');
  }

  // Skip command/agent arrays if install flags are false
  if (normalizedOptions.installCommands === false) {
    normalizedOptions.commands = [];
  }
  if (normalizedOptions.installAgents === false) {
    normalizedOptions.agents = [];
  }

  // Determine target directory based on installation type
  const isGlobalInstall = normalizedOptions.installationType === 'global';
  const workspaceRoot = process.cwd();

  // For global installations, calculate relative path from workspace to home
  const targetDir = isGlobalInstall
    ? path.join(homeDir, '.claude')
    : path.join(workspaceRoot, '.claude');

  // Calculate relative path from workspace root for tree.write()
  const relativeTargetDir = isGlobalInstall
    ? path.relative(workspaceRoot, targetDir)
    : '.claude';

  // Check for existing installation and handle force prompt (skip in dry-run mode)
  const relativeManifestPath = path.join(relativeTargetDir, 'manifest.json');

  if (!isDryRun) {
    if (tree.exists(relativeManifestPath)) {
      if (!normalizedOptions.force) {
        if (normalizedOptions.nonInteractive) {
          logger.warn(
            'Installation cancelled - existing Claude configuration found. Use --force to overwrite.'
          );
          return;
        }
      }
    }
  }

  // Create directory structure
  const commandsDir = path.join(targetDir, 'commands');
  const agentsDir = path.join(targetDir, 'agents');

  // Relative paths for tree.write()
  const relativeCommandsDir = path.join(relativeTargetDir, 'commands');
  const relativeAgentsDir = path.join(relativeTargetDir, 'agents');

  // Collect files to install
  const installedCommands: string[] = [];
  const installedAgents: string[] = [];
  const installedFiles: string[] = [];

  // Install selected commands
  const commandsToInstall = normalizedOptions.commands || [];

  for (const commandName of commandsToInstall) {
    let sourcePath: string | null = null;

    // First check for bundled content (when running as standalone package)
    const bundledContentDir = path.join(
      __dirname,
      '..',
      '..',
      'content',
      'commands'
    );
    if (fs.existsSync(bundledContentDir)) {
      // Check in bundled content subdirectories
      const contentSubDirs = fs
        .readdirSync(bundledContentDir)
        .filter((item) => {
          const itemPath = path.join(bundledContentDir, item);
          return fs.statSync(itemPath).isDirectory();
        });

      for (const subDir of contentSubDirs) {
        const potentialPath = path.join(
          bundledContentDir,
          subDir,
          `${commandName}.md`
        );
        if (fs.existsSync(potentialPath)) {
          sourcePath = potentialPath;
          break;
        }
      }
    }

    // Fall back to workspace lookup if not found in bundled content
    if (!sourcePath) {
      // Search through all subdirectories under packages/commands/
      const commandsBaseDir = path.join(workspaceRoot, 'packages/commands');

      // Check if commands directory exists
      if (fs.existsSync(commandsBaseDir)) {
        // Get all subdirectories (agnostic, mobile, web, etc.)
        const commandSubDirs = fs
          .readdirSync(commandsBaseDir)
          .filter((item) => {
            const itemPath = path.join(commandsBaseDir, item);
            return fs.statSync(itemPath).isDirectory();
          });

        // Search for the command file in each subdirectory's src folder
        for (const subDir of commandSubDirs) {
          const potentialPath = path.join(
            commandsBaseDir,
            subDir,
            'src',
            `${commandName}.md`
          );
          if (fs.existsSync(potentialPath)) {
            sourcePath = potentialPath;
            break;
          }
        }
      }
    }

    const destPath = path.join(commandsDir, `${commandName}.md`);
    const relativeDestPath = path.join(
      relativeCommandsDir,
      `${commandName}.md`
    );

    try {
      if (sourcePath && fs.existsSync(sourcePath)) {
        const content = fs.readFileSync(sourcePath, 'utf-8');
        if (!isDryRun) {
          tree.write(relativeDestPath, content);
        }
        installedCommands.push(commandName);
        installedFiles.push(path.relative(targetDir, destPath));
      } else {
        logger.warn(`Command file not found: ${commandName}`);
      }
    } catch (error) {
      logger.warn(`Error reading command ${commandName}: ${error}`);
    }
  }

  // Install selected agents
  const agentsToInstall = normalizedOptions.agents || [];

  for (const agentName of agentsToInstall) {
    let sourcePath: string | null = null;

    // First check for bundled content (when running as standalone package)
    const bundledContentDir = path.join(
      __dirname,
      '..',
      '..',
      'content',
      'agents'
    );
    if (fs.existsSync(bundledContentDir)) {
      // Check in bundled content subdirectories
      const contentSubDirs = fs
        .readdirSync(bundledContentDir)
        .filter((item) => {
          const itemPath = path.join(bundledContentDir, item);
          return fs.statSync(itemPath).isDirectory();
        });

      for (const subDir of contentSubDirs) {
        const potentialPath = path.join(
          bundledContentDir,
          subDir,
          `${agentName}.md`
        );
        if (fs.existsSync(potentialPath)) {
          sourcePath = potentialPath;
          break;
        }
      }
    }

    // Fall back to workspace lookup if not found in bundled content
    if (!sourcePath) {
      // Search through all subdirectories under packages/agents/
      const agentsBaseDir = path.join(workspaceRoot, 'packages/agents');

      // Check if agents directory exists
      if (fs.existsSync(agentsBaseDir)) {
        // Get all subdirectories (agnostic, mobile, web, etc.)
        const agentSubDirs = fs.readdirSync(agentsBaseDir).filter((item) => {
          const itemPath = path.join(agentsBaseDir, item);
          return fs.statSync(itemPath).isDirectory();
        });

        // Search for the agent file in each subdirectory's src folder
        for (const subDir of agentSubDirs) {
          const potentialPath = path.join(
            agentsBaseDir,
            subDir,
            'src',
            `${agentName}.md`
          );
          if (fs.existsSync(potentialPath)) {
            sourcePath = potentialPath;
            break;
          }
        }
      }
    }

    const destPath = path.join(agentsDir, `${agentName}.md`);
    const relativeDestPath = path.join(relativeAgentsDir, `${agentName}.md`);

    try {
      if (sourcePath && fs.existsSync(sourcePath)) {
        const content = fs.readFileSync(sourcePath, 'utf-8');
        if (!isDryRun) {
          tree.write(relativeDestPath, content);
        }
        installedAgents.push(agentName);
        installedFiles.push(path.relative(targetDir, destPath));
      } else {
        logger.warn(`Agent file not found: ${agentName}`);
      }
    } catch (error) {
      logger.warn(`Error reading agent ${agentName}: ${error}`);
    }
  }

  // Display installation plan
  logger.info('📦 Installation Plan:');
  logger.info(
    `  Location: ${
      normalizedOptions.installationType === 'global'
        ? `Global (${targetDir})`
        : `Local (${targetDir})`
    }`
  );
  logger.info(`  Commands: ${installedCommands.length} selected`);
  logger.info(`  Agents: ${installedAgents.length} selected`);

  if (isDryRun) {
    logger.info('\n📋 Would install:');
    installedFiles.forEach((file) => {
      logger.info(`  - ${file}`);
    });

    // Show auto-update checker setup plan
    logger.info('\n🔄 Would also set up auto-update checker:');
    logger.info('  - Auto-detect your shell (bash, zsh, or fish)');
    logger.info('  - Add update check script to your shell configuration');
    logger.info('  - Checks once per week for new versions');
    logger.info('  - Runs in background (non-blocking)');
    logger.info(
      '  - Can be disabled with: export AI_TOOLKIT_SKIP_UPDATE_CHECK=1'
    );

    return;
  }

  // Create manifest (skip in dry-run mode)
  if (!isDryRun) {
    const manifest: Manifest = {
      version: '1.0.0',
      installedAt: new Date().toISOString(),
      commands: installedCommands,
      agents: installedAgents,
      files: installedFiles,
    };

    writeJson(tree, relativeManifestPath, manifest);

    await formatFiles(tree);
  }

  if (!isDryRun) {
    logger.info('✅ Claude Code configuration installed successfully!');
    logger.info(`📁 Location: ${targetDir}`);
    logger.info(`📝 Use these in Claude Code immediately`);

    // Install update checker
    try {
      logger.info('\n🔄 Installing auto-update checker...');
      const shell = detectShell();
      const version = getCurrentToolkitVersion();
      installUpdateChecker(shell, version);
    } catch (error) {
      logger.warn(`⚠️  Failed to install update checker: ${error}`);
      logger.info(
        'This is a bug in ai-toolkit, please report it to the #pod-dev-ai Slack channel'
      );
    }

    // Install hooks if requested
    if (normalizedOptions.installHooks) {
      try {
        logger.info('\n🔔 Installing notification hooks...');
        if (!hooksGenerator) {
          throw new Error('hooksGenerator export not found');
        }
        await hooksGenerator(tree, {
          force: normalizedOptions.force || false,
          dry: false,
          backup: true,
          verbose: false,
        });
        logger.info('✅ Notification hooks installed successfully');
      } catch (error: any) {
        logger.error('❌ Failed to install notification hooks');
        logger.error(error.message);
        logger.info('   Continuing with installation...');
        // Continue anyway - hooks are optional
      }
    }

    // Prompt for and install addons in custom mode, after hooks
    let addonsInstalled = false;
    let shouldInstallAddons = normalizedOptions.installAddons === true;
    const installAddonsExplicit =
      explicitlyProvided.has('installAddons') ||
      explicitlyProvided.has('install-addons');

    if (
      normalizedOptions.installMode === 'custom' &&
      !installAddonsExplicit &&
      !nxNoInteractiveProvided &&
      !normalizedOptions.nonInteractive
    ) {
      const { value } = await prompt<{ value: boolean }>({
        type: 'confirm',
        name: 'value',
        message: '🔌 Install addons/mcps?',
        initial: false,
      });
      shouldInstallAddons = value;
    }

    if (shouldInstallAddons) {
      try {
        logger.info('\n🔌 Installing addons...');
        if (!addonsGenerator) {
          throw new Error('addonsGenerator export not found');
        }

        await addonsGenerator(
          tree,
          // In default mode, install all MCPs. In custom mode, let user choose
          normalizedOptions.installMode === 'default'
            ? {
                dry: false, // Never run in dry-run mode in default mode
                installMode: 'all' as const,
                force: normalizedOptions.force || false,
                skipVerification: false, // Don't skip verification in default mode
                dashboardMode: 'always' as const, // Auto-start dashboard
                port: 0, // Use default port
              }
            : {
                // Custom mode - let addons generator prompt user
                force: normalizedOptions.force || false,
              }
        );
        logger.info('✅ Addons installed successfully');
        addonsInstalled = true;
      } catch (error: any) {
        logger.error('❌ Failed to install addons');
        logger.error(error.message);
        logger.info('   Continuing with installation...');
        // Continue anyway - addons are optional
      }
    }

    // Final summary
    logger.info('\n✨ Installation complete!');
    if (installedCommands.length > 0) {
      logger.info(`   Commands: ${installedCommands.join(', ')}`);
    }
    if (installedAgents.length > 0) {
      logger.info(`   Agents: ${installedAgents.join(', ')}`);
    }
    if (normalizedOptions.installHooks) {
      logger.info('   Hooks: ✅ Installed');
    }
    if (addonsInstalled) {
      logger.info('   Addons: ✅ Installed');
    }
  } else {
    // Dry-run mode - show what would be installed for hooks/addons
    if (normalizedOptions.installHooks) {
      logger.info(
        '\n🔍 DRY RUN: Would install notification hooks (sound mode)'
      );
    }
    // In custom mode, the addons prompt occurs after hooks
    const installAddonsExplicit =
      explicitlyProvided.has('installAddons') ||
      explicitlyProvided.has('install-addons');
    if (
      normalizedOptions.installMode === 'custom' &&
      !installAddonsExplicit &&
      !normalizedOptions.nonInteractive
    ) {
      logger.info(
        '\n🔍 DRY RUN: Would prompt to install spec-mcp-workflow addon after hooks'
      );
    } else if (normalizedOptions.installAddons) {
      logger.info('\n🔍 DRY RUN: Would install spec-mcp-workflow addon');
    }
  }
}

function checkClaudeInstalled(): boolean {
  try {
    execSync('which claude', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function promptInstallClaude(): Promise<boolean> {
  const { install } = await prompt<{ install: boolean }>({
    type: 'confirm',
    name: 'install',
    message: 'Would you like to install Claude CLI?',
    initial: true,
  });
  return install;
}

async function installClaude(): Promise<void> {
  const platform = process.platform;

  // Platform check remains but with adjusted messaging
  if (platform !== 'darwin') {
    logger.warn(
      '⚠️  Note: Claude CLI installation may require additional steps on non-macOS platforms'
    );
  }

  logger.info('📦 Installing Claude CLI...');

  // Try curl installation first
  const curlSuccess = await installViaCurl();
  if (curlSuccess) {
    await verifyInstallation('curl');
    return;
  }

  // Fallback to npm if curl fails
  logger.info('Curl method failed, falling back to npm installation...');
  const npmSuccess = await installViaNpm();
  if (npmSuccess) {
    await verifyInstallation('npm');
    return;
  }

  // If both fail, provide manual instructions
  provideManualInstructions();
}

/**
 * Attempts to install Claude CLI using the curl method
 * @returns true if installation succeeded, false otherwise
 */
async function installViaCurl(): Promise<boolean> {
  logger.info('Attempting installation via curl...');

  try {
    // Check if curl is available
    execSync('which curl', { stdio: 'ignore' });

    execSync('curl -fsSL https://claude.ai/install.sh | bash', {
      stdio: 'inherit',
      shell: '/bin/bash',
      timeout: 300000, // 5 minute timeout
    });

    logger.info('✅ Claude CLI installed successfully via curl!');
    return true;
  } catch (error: any) {
    logger.warn('Curl installation failed, attempting npm fallback...');
    logger.debug(`Curl error details: ${error.message}`);
    return false;
  }
}

/**
 * Attempts to install Claude CLI using npm as a fallback method
 * @returns true if installation succeeded, false otherwise
 */
async function installViaNpm(): Promise<boolean> {
  logger.info('Installing via npm: npm install -g @anthropic-ai/claude-code');

  try {
    // Check if npm is available
    execSync('which npm', { stdio: 'ignore' });

    // Note: NOT using sudo to avoid permission issues
    execSync('npm install -g @anthropic-ai/claude-code', {
      stdio: 'inherit',
      timeout: 300000, // 5 minute timeout
    });

    logger.info('✅ Claude CLI installed successfully via npm!');
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      logger.error('❌ npm not found. Please install Node.js and npm first.');
      logger.info('Visit https://nodejs.org/ to install Node.js');
    } else if (
      error.message?.includes('permission') ||
      error.message?.includes('EACCES')
    ) {
      logger.error('❌ npm installation failed due to permissions.');
      logger.info('Try running: npm install -g @anthropic-ai/claude-code');
      logger.info('Then run: claude migrate-installer');
    } else {
      logger.error(`❌ npm installation failed: ${error.message}`);
    }
    return false;
  }
}

/**
 * Verifies that Claude CLI was successfully installed
 * @param method The installation method that was used
 */
async function verifyInstallation(method: 'curl' | 'npm'): Promise<void> {
  try {
    // Check that the claude binary is available on PATH
    execSync('which claude', { stdio: 'ignore' });
    logger.info(`✅ Claude CLI found (installed via ${method})`);
    logger.info('You can also run "claude --version" to verify');
  } catch {
    logger.warn('⚠️  Claude CLI not found in PATH');
    logger.info(
      'You may need to restart your terminal or add Claude to your PATH'
    );
  }
}

/**
 * Provides manual installation instructions when automatic methods fail
 */
function provideManualInstructions(): void {
  logger.error('❌ Automatic installation failed');
  logger.info('\n📚 Manual Installation Instructions:');
  logger.info('1. Via curl: curl -fsSL https://claude.ai/install.sh | bash');
  logger.info('2. Via npm: npm install -g @anthropic-ai/claude-code');
  logger.info(
    '3. Visit: https://claude.ai/download for platform-specific instructions'
  );
  logger.info(
    '\nFor troubleshooting, run "claude doctor" after manual installation'
  );
}

export default initGenerator;
