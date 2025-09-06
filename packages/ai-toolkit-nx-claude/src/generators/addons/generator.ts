import type { Tree } from '@nx/devkit';
import { formatFiles } from '@nx/devkit';
import type { AddonsGeneratorSchema } from './schema';
import { promptForMissingOptions } from '../../utils/prompt-utils';
import {
  isNxDryRunProvided,
  isNxNoInteractiveProvided,
} from '../../utils/cli-parser';
import {
  getAddonById,
  isAddonInstalled,
  validateAddonRequirements,
} from './addon-registry';
import {
  checkGitHubAuth,
  setupGitHubAuth,
  validatePackageAccess,
  getAuthInstructions,
} from './github-auth';
import {
  installMcpServer,
  verifyMcpInstallation,
  updateMcpServer,
  // removeMcpServer,
} from './claude-mcp-installer';
import { setupSpecWorkflow } from './spec-workflow-setup';

/**
 * Main generator function for installing Claude Code addons
 */
export default async function generator(
  tree: Tree,
  schema: AddonsGeneratorSchema
): Promise<void> {
  console.log('\n🎯 Claude Code Addons Installer');
  console.log('================================\n');

  // Track whether project setup was performed
  let projectSetupCompleted = false;

  // Check if Nx dry-run flag was provided
  const dryRunFlagProvided = isNxDryRunProvided();
  const noInteractive = isNxNoInteractiveProvided();

  // Determine if we're in dry-run mode
  let isDryRun = dryRunFlagProvided;

  // If dry-run flag wasn't provided and not in no-interactive mode, prompt for it
  if (!dryRunFlagProvided && !noInteractive) {
    const { runDryRun } = await require('enquirer').prompt({
      type: 'confirm',
      name: 'runDryRun',
      message:
        '🔍 Would you like to run in dry-run mode (preview changes without making them)?',
      initial: false,
    });
    isDryRun = runDryRun;
  }

  // Parse CLI args and prompt for missing options
  if (isDryRun) {
    console.log('🔍 Dry-run mode activated\n');
  }

  // Always prompt for options (even in dry-run mode) to customize the output
  const options = (await promptForMissingOptions(
    schema,
    require('./schema.json')
  )) as AddonsGeneratorSchema & { dryRun?: boolean };

  // Set the dryRun flag based on our earlier determination
  options.dryRun = isDryRun;

  // Get the selected addon
  const addon = getAddonById(options.addon || 'spec-workflow-mcp');
  if (!addon) {
    throw new Error(`Unknown addon: ${options.addon}`);
  }

  console.log(`\n📦 Installing: ${addon.name}`);
  console.log(`   ${addon.description}\n`);

  // Check if already installed
  if (!options.force && !options.dryRun) {
    const installed = await isAddonInstalled(addon.id);
    if (installed) {
      console.log('✅ Addon is already installed');

      // Ask if user wants to update configuration
      const { confirm } = await require('enquirer').prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Would you like to update the configuration?',
        initial: false,
      });

      if (confirm) {
        await updateConfiguration(addon.id, options);
      }
      return;
    }
  } else if (options.dryRun) {
    // In dry-run mode, just note if it would check for existing installation
    const installed = await isAddonInstalled(addon.id);
    if (installed && !options.force) {
      console.log(
        'ℹ️  [DRY-RUN] Addon is already installed, would prompt for update'
      );
    }
  }

  // Validate requirements
  console.log('\n🔍 Checking requirements...');
  const validation = await validateAddonRequirements(addon.id);
  if (!validation.valid) {
    console.error('\n❌ Requirements not met:');
    validation.errors.forEach((error) => console.error(`   • ${error}`));

    if (!options.force) {
      throw new Error(
        'Installation requirements not met. Use --force to override.'
      );
    }
    console.log('\n⚠️  Continuing with --force flag...');
  }

  // Handle authentication for private packages (skip in dry-run mode)
  if (addon.requiresAuth) {
    if (options.dryRun) {
      console.log('\n🔐 [DRY-RUN] Skipping GitHub authentication check');
    } else {
      console.log('\n🔐 Checking GitHub authentication...');
      const authStatus = await checkGitHubAuth();

      if (!authStatus.authenticated || !authStatus.valid) {
        console.log(
          '\n📝 GitHub authentication required for private @uniswap packages'
        );
        console.log(getAuthInstructions());

        // Prompt for token if not in CI
        if (!process.env.CI && !options.githubToken) {
          const { token } = await require('enquirer').prompt({
            type: 'password',
            name: 'token',
            message: 'GitHub Personal Access Token:',
            validate: (value: string) => value.length > 0,
          });
          options.githubToken = token;
        }

        if (options.githubToken) {
          console.log('\n🔧 Setting up GitHub authentication...');
          const setupResult = await setupGitHubAuth(options.githubToken);

          if (!setupResult.valid) {
            throw new Error(
              setupResult.error || 'Failed to setup GitHub authentication'
            );
          }
          console.log('✅ Authentication configured successfully');
        } else {
          throw new Error(
            'GitHub authentication required. Please provide a token.'
          );
        }
      } else {
        console.log('✅ GitHub authentication found');
      }

      // Validate package access
      console.log(`\n🔍 Validating access to ${addon.packageName}...`);
      const accessResult = await validatePackageAccess(addon.packageName);

      if (!accessResult.accessible) {
        throw new Error(accessResult.error || 'Cannot access package');
      }
      console.log(`✅ Package accessible (version: ${accessResult.version})`);
    }
  }

  // Install the addon based on type
  if (addon.type === 'mcp-server') {
    await installMcpAddon(addon, options);

    // If the addon has project setup configuration, prompt for setup
    if (addon.projectSetup) {
      // Ask user if they want to set up project configuration
      const { setupProject } = await require('enquirer').prompt({
        type: 'confirm',
        name: 'setupProject',
        message:
          '📁 Would you like to set up spec-workflow configuration for a particular project?',
        initial: true,
      });

      if (setupProject) {
        // Prompt for project path
        const { projectPath } = await require('enquirer').prompt({
          type: 'input',
          name: 'projectPath',
          message:
            '📁 Enter the project path where spec-workflow config should be added:',
          initial: process.cwd(),
          result: (value: string) => value || process.cwd(),
        });

        options.projectPath = projectPath;

        if (options.dryRun) {
          console.log(
            `\n📁 [DRY-RUN] Would set up project configuration at: ${projectPath}`
          );
        }

        await installProjectSetup(addon, options);
        projectSetupCompleted = true;
      } else if (options.dryRun) {
        console.log(
          '\n📁 [DRY-RUN] Skipping project configuration (user chose not to set up)'
        );
      }
    }
  } else {
    throw new Error(`Addon type '${addon.type}' is not yet supported`);
  }

  // Verify installation (skip in dry-run mode)
  if (!options.skipVerification && !options.dryRun) {
    console.log('\n🔍 Verifying installation...');
    const serverName = addon.mcp?.serverName || addon.id;
    const verification = await verifyMcpInstallation(serverName);

    if (verification.installed) {
      console.log('✅ Installation verified successfully');

      // Show usage instructions
      showUsageInstructions(addon, options, projectSetupCompleted);
    } else {
      console.log('⚠️  Could not verify installation');
      console.log('   The addon may still work correctly.');
      // Show usage instructions anyway
      showUsageInstructions(addon, options, projectSetupCompleted);
    }
  } else if (options.dryRun) {
    console.log('\n🔍 [DRY-RUN] Skipping installation verification');
    // Still show usage instructions in dry-run mode
    showUsageInstructions(addon, options, projectSetupCompleted);
  }

  if (options.dryRun) {
    console.log('\n✨ Dry-run complete! No changes were made.\n');
  } else {
    console.log('\n✨ Installation complete!\n');
  }

  await formatFiles(tree);
}

/**
 * Install an MCP server addon
 */
async function installMcpAddon(
  addon: any,
  options: AddonsGeneratorSchema & { dryRun?: boolean }
): Promise<void> {
  if (options.dryRun) {
    console.log('\n🔧 [DRY-RUN] Simulating MCP server installation...');
  } else {
    console.log('\n🔧 Installing MCP server...');
  }

  // Build additional arguments based on the addon and options
  const additionalArgs: string[] = [];

  // Add spec-workflow specific arguments
  if (addon.id === 'spec-workflow-mcp') {
    // Dashboard mode flags
    if (options.dashboardMode === 'always') {
      additionalArgs.push('--AutoStartDashboard');
    }
    // manual mode doesn't need a flag

    // Port configuration
    if (options.port && options.port > 0) {
      additionalArgs.push(`--Port=${options.port}`);
    }
  }

  // For other MCP servers, different args could be added based on their needs
  // Example:
  // if (addon.id === 'github-mcp' && options.githubToken) {
  //   additionalArgs.push(`--token=${options.githubToken}`);
  // }

  const installResult = await installMcpServer({
    addon,
    additionalArgs,
    dryRun: options.dryRun,
  });

  if (!installResult.success) {
    throw new Error(installResult.error || installResult.message);
  }

  console.log(`✅ ${installResult.message}`);
}

/**
 * Install project setup configuration for an addon
 */
async function installProjectSetup(
  addon: any,
  options: AddonsGeneratorSchema & { dryRun?: boolean }
): Promise<void> {
  console.log('\n🔧 Setting up project configuration...');

  // Use the project path from options or current directory
  const projectPath = options.projectPath || process.cwd();
  console.log(`📍 Using project directory: ${projectPath}`);

  const result = await setupSpecWorkflow(projectPath, options);

  if (!result.success) {
    throw new Error(result.message);
  }

  console.log(`✅ ${result.message}`);
}

/**
 * Update configuration for an existing addon
 */
async function updateConfiguration(
  addonId: string,
  options: AddonsGeneratorSchema
): Promise<void> {
  console.log('\n🔧 Updating configuration...');

  const addon = getAddonById(addonId);
  if (!addon) {
    console.error(`❌ Unknown addon: ${addonId}`);
    return;
  }

  const serverName = addon.mcp?.serverName || addon.id;

  // Build updates based on addon type
  const argUpdates: { remove?: string[]; add?: string[] } = {
    remove: [],
    add: [],
  };

  // Handle spec-workflow specific updates
  if (addon.id === 'spec-workflow-mcp') {
    // Update dashboard mode
    if (options.dashboardMode) {
      // Remove existing dashboard flags
      argUpdates.remove!.push('--AutoStartDashboard');

      // Add new dashboard flag
      if (options.dashboardMode === 'always') {
        argUpdates.add!.push('--AutoStartDashboard');
      }
    }

    // Update port
    if (options.port !== undefined) {
      // Remove existing port flag
      argUpdates.remove!.push('--Port=');

      // Add new port flag if not 0
      if (options.port > 0) {
        argUpdates.add!.push(`--Port=${options.port}`);
      }
    }
  }

  const result = await updateMcpServer(serverName, argUpdates);

  if (result.success) {
    console.log(`✅ ${result.message}`);
  } else {
    console.error(`❌ ${result.message}`);
  }
}

/**
 * Show usage instructions after installation
 */
function showUsageInstructions(
  addon: any,
  options: AddonsGeneratorSchema & { dryRun?: boolean },
  projectSetupCompleted = false
): void {
  console.log('\n📚 Usage Instructions:');
  console.log('====================\n');

  if (addon.id === 'spec-workflow-mcp') {
    console.log(
      '1. Start a new instance of Claude Code to load the new MCP server'
    );
    console.log('2. Open your project in Claude Code');

    if (options.dashboardMode === 'always') {
      console.log('3. The spec-workflow dashboard will start automatically');
      console.log(
        `   Dashboard URL: http://localhost:${options.port || 50014}`
      );
    } else {
      console.log(
        '3. Start the dashboard manually with: npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/spec-workflow-mcp@latest --dashboard'
      );
    }

    console.log('\n📋 Available MCP Tools:');
    console.log('  • spec-workflow-guide - Get workflow documentation');
    console.log('  • create-spec-doc - Create spec documents');
    console.log('  • spec-status - Check specification status');
    console.log('  • manage-tasks - Manage implementation tasks');
    console.log('  • request-approval - Request human approval for documents');
    console.log('  • orchestrate-with-agents - Use AI agent orchestration');
    console.log('  • And more...');

    // If project setup was also configured and completed
    if (addon.projectSetup && projectSetupCompleted) {
      console.log('\n📁 Project Configuration:');
      console.log(
        '  ✅ Spec-workflow configuration has been added to your project'
      );
      console.log('  • .spec-workflow/ - Configuration directory');
      console.log(
        '  • .spec-workflow/orchestration.yaml - Agent orchestration config'
      );

      console.log('\n🤖 Agent Orchestration:');
      console.log('  Automatic agent orchestration is ENABLED by default');
      console.log('  Edit .spec-workflow/orchestration.yaml to customize');
    }

    console.log('\n🚀 Quick Start - start a new instance of Claude Code and:');
    console.log('  1. Ask Claude: "Show me the spec workflow guide"');
    console.log('  2. Ask Claude: "Help me create a new spec for [feature]"');
    console.log('  3. Visit the dashboard to monitor progress');
    console.log('  4. Start creating specs for your features!');
  }
}
