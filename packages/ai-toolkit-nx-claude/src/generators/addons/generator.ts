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
  getAvailableAddons,
  isAddonInstalled,
  validateAddonRequirements,
} from './addon-registry';
import {
  installMcpServer,
  // updateMcpServer,
  // removeMcpServer,
} from './claude-mcp-installer';
import { setupSpecWorkflow } from './spec-workflow-setup';
import {
  setupAwsLogAnalyzer,
  getAwsLogAnalyzerServerPath,
} from './aws-log-analyzer-setup';

/**
 * Main generator function for installing Claude Code addons
 */
export default async function generator(
  tree: Tree,
  schema: AddonsGeneratorSchema
): Promise<void> {
  console.log('\n🎯 Claude Code Addons Installer');
  console.log('================================\n');

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

  // Check if parent generator wants to skip prompting
  let options: AddonsGeneratorSchema & { dryRun?: boolean };

  if (schema.installMode === 'default') {
    // Skip prompting - use provided options
    options = {
      selectionMode: schema.selectionMode || 'all',
      force: schema.force || false,
      skipVerification: schema.skipVerification || false,
      dashboardMode: schema.dashboardMode || 'always',
      port: schema.port || 0,
      dry: schema.dry || false,
      installMode: 'default',
      dryRun: isDryRun,
    };
  } else {
    // Normal prompting flow
    const availableAddons = getAvailableAddons();
    options = (await promptForMissingOptions(schema, require('./schema.json'), {
      availableAddons: availableAddons.map((a) => a.id),
      addonDescriptions: availableAddons.reduce((acc, a) => {
        acc[a.id] = `${a.name}: ${a.description}`;
        return acc;
      }, {} as Record<string, string>),
    })) as AddonsGeneratorSchema & { dryRun?: boolean };

    // Set the dryRun flag based on our earlier determination
    options.dryRun = isDryRun;
  }

  // Handle "install all" mode
  if (options.selectionMode === 'all') {
    await installAllAddons(tree, options);
    return;
  }

  // Handle "specific" mode - install selected addons
  await installSelectedAddons(tree, options);

  await formatFiles(tree);
}

/**
 * Install selected MCP server addons
 */
async function installSelectedAddons(
  tree: Tree,
  options: AddonsGeneratorSchema & { dryRun?: boolean }
): Promise<void> {
  // Get selected addons
  const selectedAddonIds = options.addons || [];

  if (selectedAddonIds.length === 0) {
    console.log('\n⚠️  No addons selected for installation');
    return;
  }

  const selectedAddons = selectedAddonIds
    .map((id) => getAddonById(id))
    .filter((addon) => addon !== undefined);

  if (selectedAddons.length === 0) {
    throw new Error('No valid addons found in selection');
  }

  console.log('\n📦 Installing Selected MCP Servers');
  console.log('===================================\n');
  console.log(`Installing ${selectedAddons.length} MCP server(s)\n`);

  const results: Array<{ addon: any; success: boolean; error?: string }> = [];

  // Install each selected addon
  for (let i = 0; i < selectedAddons.length; i++) {
    const addon = selectedAddons[i];
    console.log(
      `\n[${i + 1}/${selectedAddons.length}] Installing: ${addon.name}`
    );
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

      // If this is spec-workflow and it's the only/last addon, prompt for project setup
      if (
        addon.id === 'spec-workflow-mcp' &&
        addon.projectSetup &&
        i === selectedAddons.length - 1
      ) {
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
        } else if (options.dryRun) {
          console.log(
            '\n📁 [DRY-RUN] Skipping project configuration (user chose not to set up)'
          );
        }
      }

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
    showGeneralMcpInstructions(selectedAddons);
  } else {
    console.log('\n✨ Installation complete!\n');
    // Show general MCP authentication instructions
    showGeneralMcpInstructions(successful.map((r) => r.addon));
  }
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
  // Special handling for AWS Log Analyzer - clone repository first
  if (addon.id === 'aws-log-analyzer-mcp') {
    console.log('\n📦 AWS Log Analyzer requires repository setup...');
    const setupResult = await setupAwsLogAnalyzer(options);

    if (!setupResult.success) {
      throw new Error(setupResult.error || setupResult.message);
    }

    console.log(`✅ ${setupResult.message}`);

    // Now build the args dynamically with the cloned path
    const serverPath = setupResult.serverPath || getAwsLogAnalyzerServerPath();
    addon.mcp.args = ['--directory', serverPath, 'run', 'server.py'];

    console.log(`📍 Server path: ${serverPath}`);
  }

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
      addon.id === 'aws-log-analyzer-mcp' ||
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

  // Show specific authentication instructions for Slack, GitHub, and AWS
  const hasSlack = installedAddons.some((addon) => addon.id === 'slack-mcp');
  const hasGithub = installedAddons.some((addon) => addon.id === 'github-mcp');
  const hasAws = installedAddons.some(
    (addon) => addon.id === 'aws-log-analyzer-mcp'
  );

  if (hasSlack || hasGithub || hasAws) {
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

    if (hasAws) {
      console.log('🔐 AWS Log Analyzer MCP:');
      console.log('   Configure AWS credentials using one of these methods:');
      console.log('   1. Run: $ aws configure');
      console.log(
        '   2. Set environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION'
      );
      console.log(
        '   3. Use AWS credentials file: ~/.aws/credentials and ~/.aws/config'
      );
      console.log(
        '   📖 Documentation: https://github.com/awslabs/Log-Analyzer-with-MCP'
      );
      console.log(
        '   Required IAM permissions: CloudWatchLogsReadOnlyAccess\n'
      );
    }
  }
}
