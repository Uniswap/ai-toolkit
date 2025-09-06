import type { Tree } from '@nx/devkit';
import { formatFiles, logger } from '@nx/devkit';
import * as path from 'path';
import type { HooksGeneratorSchema } from './schema';
import { promptForMissingOptions } from '../../utils/prompt-utils';
import { checkAndValidateDependencies } from './dependency-checker';
import { ensureRepository, cleanupRepository } from './repo-manager';
import { runInstallation, testHooks } from './install-orchestrator';
import {
  getExplicitlyProvidedOptions,
  isNxDryRunProvided,
  isNxNoInteractiveProvided,
} from './cli-parser';

/**
 * Main generator function for installing Claude Code hooks
 * Sets up notification system for user input alerts
 */
export async function hooksGenerator(
  tree: Tree,
  options: HooksGeneratorSchema
): Promise<void> {
  logger.info('🎯 Claude Code Hooks Generator');
  logger.info('Installing notification hooks for Claude Code...\n');

  // Step 1: Check dependencies
  logger.info('📋 Step 1: Checking dependencies...');
  // Debug logging (remove in production)
  // logger.info(`options: ${JSON.stringify(options, null, 2)}`);
  const depsOk = await checkAndValidateDependencies();
  if (!depsOk && !options.force) {
    logger.error(
      '❌ Missing required dependencies. Install them and try again.'
    );
    logger.info('Use --force to skip dependency checks (not recommended)');
    return;
  }

  // Step 2: Get generator options through prompts if needed
  const schemaPath = path.join(__dirname, 'schema.json');
  let normalizedOptions: HooksGeneratorSchema;

  // Get the list of explicitly provided CLI options with their values
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

  // Pass the no-interactive flag to prompt-utils via options
  const optionsWithNoInteractive = {
    ...options,
    'no-interactive': nxNoInteractiveProvided,
  };

  try {
    normalizedOptions = await promptForMissingOptions(
      optionsWithNoInteractive,
      schemaPath,
      {}, // context for multi-select (not used here)
      explicitlyProvided // pass the explicitly provided options
    );
  } catch (error: any) {
    if (error.message?.includes('Installation cancelled')) {
      logger.warn(`❌ ${error.message}`);
      return;
    }
    throw error;
  }

  // Handle dry-run mode (check both dry and dry-run for compatibility)
  const isDryRun = normalizedOptions.dry;
  if (isDryRun) {
    logger.info('\n🔍 DRY RUN MODE - No changes will be made');
    logger.info('The following would be performed:');
    logger.info(`  1. Download latest notification hooks`);
    logger.info(`  2. Configure notification hooks`);
    logger.info(`  3. Install hooks to ~/.claude/hooks/`);
    logger.info(`  4. Update ~/.claude/settings.json`);
    if (normalizedOptions.backup) {
      logger.info(`  5. Create backup of existing configuration`);
    }
    return;
  }

  // Step 3: Clone or update the repository (always get latest)
  logger.info('\n📦 Step 2: Downloading notification hooks...');
  const repoPath = await ensureRepository({
    update: true, // Always update to latest
    verbose: normalizedOptions.verbose,
  });

  if (!repoPath) {
    logger.error('❌ Failed to prepare repository');
    return;
  }

  logger.info(`✅ Repository ready at: ${repoPath}`);

  // Step 4: Run the installation
  logger.info('\n🚀 Step 3: Installing hooks...');
  const installResult = await runInstallation(repoPath, {
    backupExisting: normalizedOptions.backup !== false,
    verbose: normalizedOptions.verbose || false,
    dryRun: isDryRun,
  });

  if (!installResult.success) {
    logger.error('❌ Installation failed');
    if (installResult.error) {
      logger.error(`Error: ${installResult.error}`);
    }

    // Cleanup repository on failure
    if (!normalizedOptions.verbose) {
      cleanupRepository(repoPath);
    }
    return;
  }

  // Step 5: Test the installation (optional)
  const shouldTest = !isDryRun && normalizedOptions.verbose;
  if (shouldTest) {
    logger.info('\n🧪 Step 4: Testing installation...');
    const { prompt } = await import('enquirer');
    const { runTest } = await prompt<{ runTest: boolean }>({
      type: 'confirm',
      name: 'runTest',
      message: 'Would you like to test the hooks now?',
      initial: true,
    });

    if (runTest) {
      await testHooks();
    }
  }

  // Step 6: Cleanup
  if (!normalizedOptions.verbose) {
    logger.info('\n🧹 Cleaning up temporary files...');
    cleanupRepository(repoPath);
  }

  // Format any files if needed (though we don't write to the tree in this generator)
  await formatFiles(tree);

  // Final success message
  logger.info('\n✨ SUCCESS! Claude Code hooks installed successfully!');
  logger.info('\n📚 Next Steps:');
  logger.info('  1. Start a Claude Code session');
  logger.info("  2. When Claude needs your input, you'll hear a notification");
  logger.info('  3. Check ~/.claude/logs/ for event logs (if enabled)');

  if (installResult.backupPath) {
    logger.info(`\n💾 Backup saved at: ${installResult.backupPath}`);
  }

  logger.info('\n🎉 Happy coding with Claude!');
}

export default hooksGenerator;
