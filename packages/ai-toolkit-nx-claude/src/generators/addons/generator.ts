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
  const dryRunFlagProvided = isNxDryRunProvided() ?? schema.dry;
  const noInteractive = isNxNoInteractiveProvided();

  // Determine if we're in dry-run mode
  let isDryRun = dryRunFlagProvided;

  // If dry-run flag wasn't provided and not in no-interactive mode, prompt for it
  if (isDryRun === undefined && !noInteractive) {
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

  // Handle "install all" mode
  if (options.installMode === 'all') {
    await installAllAddons(tree, options);
    return;
  }

  // Get the selected addon (specific mode)
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

  // Show general MCP authentication instructions (always, even in dry-run)
  showGeneralMcpInstructions([addon]);

  await formatFiles(tree);
}

/**
 * Install all available MCP server addons
 */
async function installAllAddons(
  tree: Tree,
  options: AddonsGeneratorSchema & { dryRun?: boolean }
): Promise<void> {
  const allAddons = require('./addon-registry').getAvailableAddons();

  console.log('\n📦 Installing All Recommended MCP Servers');
  console.log('==========================================\n');
  console.log(`Found ${allAddons.length} MCP servers to install\n`);

  const results: Array<{ addon: any; success: boolean; error?: string }> = [];

  // Install each addon
  for (let i = 0; i < allAddons.length; i++) {
    const addon = allAddons[i];
    console.log(`\n[${i + 1}/${allAddons.length}] Installing: ${addon.name}`);
    console.log(`   ${addon.description}`);

    try {
      // Check if already installed
      if (!options.force && !options.dryRun) {
        const installed = await isAddonInstalled(addon.id);
        if (installed) {
          console.log('   ✅ Already installed, skipping');
          results.push({ addon, success: true });
          continue;
        }
      }

      // Validate requirements
      const validation = await validateAddonRequirements(addon.id);
      if (!validation.valid && !options.force) {
        console.log('   ⚠️  Requirements not met:');
        validation.errors.forEach((error) => console.log(`      • ${error}`));
        console.log('   ⏭️  Skipping (use --force to override)');
        results.push({
          addon,
          success: false,
          error: 'Requirements not met',
        });
        continue;
      }

      // Install the MCP server
      await installMcpAddon(addon, options);
      results.push({ addon, success: true });
    } catch (error) {
      console.error(
        `   ❌ Failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      results.push({
        addon,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Show summary
  console.log('\n\n📊 Installation Summary');
  console.log('======================\n');

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successfully installed: ${successful.length}`);
  successful.forEach((r) => console.log(`   • ${r.addon.name}`));

  if (failed.length > 0) {
    console.log(`\n❌ Failed to install: ${failed.length}`);
    failed.forEach((r) =>
      console.log(`   • ${r.addon.name} - ${r.error || 'Unknown error'}`)
    );
  }

  if (options.dryRun) {
    console.log('\n✨ Dry-run complete! No changes were made.\n');
    // Show general MCP authentication instructions (even in dry-run)
    showGeneralMcpInstructions(allAddons);
  } else {
    console.log('\n✨ Batch installation complete!\n');
    // Show general MCP authentication instructions
    showGeneralMcpInstructions(successful.map((r) => r.addon));
  }
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
      console.log(
        '3. The spec-workflow dashboard will start automatically once you ask claude code "use the spec-workflow mcp to <do some task>"'
      );
      console.log(
        `   Dashboard URL: http://localhost:${options.port || 50014}`
      );
    } else {
      console.log(
        '3. Start the dashboard manually with: npx @uniswap/spec-workflow-mcp@latest --dashboard'
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

  // Show authentication instructions for specific MCPs
  showAuthInstructions(addon);
}

/**
 * Show authentication instructions for MCPs that require setup
 */
function showAuthInstructions(addon: any): void {
  if (addon.id === 'slack-mcp') {
    console.log('\n🔐 Slack MCP Authentication:');
    console.log(
      '  📖 Documentation: https://www.notion.so/uniswaplabs/Using-a-Slack-MCP-with-Claude-Claude-Code-249c52b2548b8052b901dc05d90e57fc'
    );
    console.log(
      '  This guide contains detailed instructions on how to obtain your Slack bot token.'
    );
  } else if (addon.id === 'github-mcp') {
    console.log('\n🔐 GitHub MCP Authentication:');
    console.log('  You can obtain your GitHub Personal Access Token using:');
    console.log('  $ gh auth token');
    console.log('  (Requires GitHub CLI to be installed and authenticated)');
  }
}

/**
 * Show general MCP setup instructions
 */
function showGeneralMcpInstructions(installedAddons: any[]): void {
  console.log('\n📚 Getting Started with Your MCPs');
  console.log('==================================\n');

  console.log("Most MCPs require authentication before use. Here's how:");
  console.log('\n1. Start a new Claude Code session');
  console.log('2. Run the `/mcp` slash command');
  console.log('3. Select the MCP you want to configure');
  console.log('4. Follow the authentication instructions');
  console.log('5. Once authenticated, you can use the MCP in Claude Code\n');

  console.log('📖 Example: Linear MCP Authentication');
  console.log('   https://linear.app/docs/mcp#claude');
  console.log('   (Most MCPs follow a similar authentication flow)\n');

  // Show specific MCPs that were installed and need auth
  const needsAuth = installedAddons.filter(
    (addon) =>
      addon.id === 'slack-mcp' ||
      addon.id === 'github-mcp' ||
      addon.id === 'linear-mcp' ||
      addon.id === 'notion-mcp' ||
      addon.id === 'supabase-mcp'
  );

  if (needsAuth.length > 0) {
    console.log('🔐 MCPs requiring authentication:');
    needsAuth.forEach((addon) => {
      console.log(`   • ${addon.name}`);
    });
    console.log('');
  }

  // Show specific authentication instructions for Slack and GitHub
  const hasSlack = installedAddons.some((addon) => addon.id === 'slack-mcp');
  const hasGithub = installedAddons.some((addon) => addon.id === 'github-mcp');

  if (hasSlack || hasGithub) {
    console.log('📋 Specific Authentication Instructions:\n');

    if (hasSlack) {
      console.log('🔐 Slack MCP:');
      console.log(
        '   📖 Documentation: https://www.notion.so/uniswaplabs/Using-a-Slack-MCP-with-Claude-Claude-Code-249c52b2548b8052b901dc05d90e57fc'
      );
      console.log(
        '   This guide contains detailed instructions on how to obtain your Slack bot token.\n'
      );
    }

    if (hasGithub) {
      console.log('🔐 GitHub MCP:');
      console.log('   You can obtain your GitHub Personal Access Token using:');
      console.log('   $ gh auth token');
      console.log(
        '   (Requires GitHub CLI to be installed and authenticated)\n'
      );
    }
  }
}
