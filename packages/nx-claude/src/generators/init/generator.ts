import { Tree, formatFiles, logger, writeJson } from '@nx/devkit';
import { prompt } from 'enquirer';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { InitGeneratorSchema } from './schema';
import { promptForMissingOptions } from '../../utils/prompt-utils';
import {
  getExplicitlyProvidedOptions,
  isNxNoInteractiveProvided,
} from '../hooks/cli-parser';

// Import available commands and agents from content packages
import { commands as agnosticCommands } from '@ai-toolkit/commands-agnostic';
import { agents as agnosticAgents } from '@ai-toolkit/agents-agnostic';

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
  // Step 1: Check if Claude CLI is installed
  if (!options.nonInteractive && !options.dryRun) {
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

  // Get the installation type (Nx will prompt via schema.json if not provided)
  let installationType = options.installationType;

  // Check for existing files in both locations
  const globalDir = path.join(process.env.HOME || '~', '.claude');
  const localDir = './.claude';

  // Check current target directory for overwrites
  const checkTargetDir = installationType === 'global' ? globalDir : localDir;
  const existingCommands = checkExistingFiles(
    checkTargetDir,
    'commands',
    Object.keys(agnosticCommands)
  );
  const existingAgents = checkExistingFiles(
    checkTargetDir,
    'agents',
    Object.keys(agnosticAgents)
  );

  // Check the other location for cross-location indicators
  const otherDir = installationType === 'global' ? localDir : globalDir;
  const otherLocationCommands = checkExistingFiles(
    otherDir,
    'commands',
    Object.keys(agnosticCommands)
  );
  const otherLocationAgents = checkExistingFiles(
    otherDir,
    'agents',
    Object.keys(agnosticAgents)
  );

  // Get explicitly provided CLI options
  const explicitlyProvided = getExplicitlyProvidedOptions();

  // Check if Nx's no-interactive flag was provided
  const nxNoInteractiveProvided = isNxNoInteractiveProvided();

  // Pass the no-interactive flag to prompt-utils via options
  const optionsWithNoInteractive = {
    ...options,
    installationType,
    'no-interactive': nxNoInteractiveProvided,
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
        existingCommands,
        existingAgents,
        otherLocationCommands,
        otherLocationAgents,
        installationType,
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

  if (normalizedOptions.dryRun) {
    logger.info('🔍 DRY RUN MODE - No files will be modified');
  }

  // Determine target directory based on installation type
  const targetDir =
    normalizedOptions.installationType === 'global'
      ? path.join(process.env.HOME || '~', '.claude')
      : './.claude';

  // Check for existing installation and handle force prompt
  const manifestPath = path.join(targetDir, 'manifest.json');
  if (tree.exists(manifestPath)) {
    if (!normalizedOptions.force) {
      if (normalizedOptions.nonInteractive) {
        logger.warn(
          'Installation cancelled - existing Claude configuration found. Use --force to overwrite.'
        );
        return;
      }

      const shouldOverwrite = await promptOverwrite();
      if (!shouldOverwrite) {
        logger.warn(
          'Installation cancelled - existing Claude configuration found'
        );
        return;
      }
    }
  }

  // Create directory structure
  const commandsDir = path.join(targetDir, 'commands');
  const agentsDir = path.join(targetDir, 'agents');

  // Collect files to install
  const installedCommands: string[] = [];
  const installedAgents: string[] = [];
  const installedFiles: string[] = [];

  // Install selected commands
  const commandsToInstall = normalizedOptions.allCommands
    ? Object.keys(agnosticCommands)
    : normalizedOptions.commands || [];

  // Get the actual file path to the source files
  // When running from dist, we need to go back to workspace root
  const workspaceRoot = process.cwd();

  for (const commandName of commandsToInstall) {
    const sourcePath = path.join(
      workspaceRoot,
      'packages/commands/agnostic/src',
      `${commandName}.md`
    );
    const destPath = path.join(commandsDir, `${commandName}.md`);

    try {
      if (fs.existsSync(sourcePath)) {
        const content = fs.readFileSync(sourcePath, 'utf-8');
        tree.write(destPath, content);
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
  const agentsToInstall = normalizedOptions.allAgents
    ? Object.keys(agnosticAgents)
    : normalizedOptions.agents || [];

  for (const agentName of agentsToInstall) {
    const sourcePath = path.join(
      workspaceRoot,
      'packages/agents/agnostic/src',
      `${agentName}.md`
    );
    const destPath = path.join(agentsDir, `${agentName}.md`);

    try {
      if (fs.existsSync(sourcePath)) {
        const content = fs.readFileSync(sourcePath, 'utf-8');
        tree.write(destPath, content);
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
        ? 'Global (~/.claude)'
        : 'Local (./.claude)'
    }`
  );
  logger.info(`  Commands: ${installedCommands.length} selected`);
  logger.info(`  Agents: ${installedAgents.length} selected`);

  if (normalizedOptions.dryRun) {
    logger.info('\n📋 Would install:');
    installedFiles.forEach((file) => {
      logger.info(`  - ${file}`);
    });
    return;
  }

  // Create manifest
  const manifest: Manifest = {
    version: '1.0.0',
    installedAt: new Date().toISOString(),
    commands: installedCommands,
    agents: installedAgents,
    files: installedFiles,
  };

  writeJson(tree, manifestPath, manifest);

  await formatFiles(tree);

  logger.info('✅ Claude Code configuration installed successfully!');
  logger.info(`📁 Location: ${targetDir}`);
  logger.info(`📝 Use these in Claude Code immediately`);
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
  // Check if on macOS
  const platform = process.platform;
  if (platform !== 'darwin') {
    logger.error(
      '❌ Claude CLI installation is currently only supported on macOS'
    );
    logger.info(
      'Please visit https://claude.ai/download for installation instructions for your platform'
    );
    return;
  }

  logger.info('📦 Installing Claude CLI...');
  try {
    execSync('curl -fsSL https://claude.ai/install.sh | bash', {
      stdio: 'inherit',
      shell: '/bin/bash',
    });
    logger.info('✅ Claude CLI installed successfully!');
  } catch (error) {
    logger.error('❌ Failed to install Claude CLI');
    logger.error(`Error: ${error}`);
    logger.info(
      'Please try installing manually: curl -fsSL https://claude.ai/install.sh | bash'
    );
  }
}

async function promptOverwrite(): Promise<boolean> {
  const { overwrite } = await prompt<{ overwrite: boolean }>({
    type: 'confirm',
    name: 'overwrite',
    message: 'Claude configuration already exists. Overwrite?',
    initial: false,
  });
  return overwrite;
}

export default initGenerator;
// Test comment
