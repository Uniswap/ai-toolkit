import type { Tree } from '@nx/devkit';
import { formatFiles, logger } from '@nx/devkit';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import type { SkillsGeneratorSchema } from './schema';
import { promptForMissingOptions } from '../../utils/prompt-utils';
import {
  isNxDryRunProvided,
  isNxNoInteractiveProvided,
  getExplicitlyProvidedOptions,
} from '../../utils/cli-parser';

// Import available skills from content package
import { skills as agnosticSkills } from '@ai-toolkit/skills-agnostic';

/**
 * Get available skill names
 */
export function getAvailableSkills(): string[] {
  return Object.keys(agnosticSkills);
}

/**
 * Get skill metadata by name
 */
export function getSkillById(name: string): {
  description: string;
  directoryPath: string;
} | undefined {
  return agnosticSkills[name as keyof typeof agnosticSkills];
}

/**
 * Main generator function for installing Claude Code skills
 */
export default async function generator(
  tree: Tree,
  schema: SkillsGeneratorSchema
): Promise<void> {
  logger.info('\n🎯 Claude Code Skills Installer');
  logger.info('================================\n');

  // Check if Nx dry-run flag was provided
  const dryRunFlagProvided = isNxDryRunProvided() ?? schema.dry;
  const noInteractive = isNxNoInteractiveProvided();
  const explicitlyProvided = getExplicitlyProvidedOptions();

  // Determine if we're in dry-run mode
  let isDryRun = dryRunFlagProvided;

  // If dry-run flag wasn't provided and not in no-interactive mode, prompt for it
  if (isDryRun === undefined && !noInteractive && schema.installMode !== 'default') {
    const { runDryRun } = await require('enquirer').prompt({
      type: 'confirm',
      name: 'runDryRun',
      message:
        '🔍 Would you like to run in dry-run mode (preview changes without making them)?',
      initial: false,
    });

    isDryRun = runDryRun;
  }

  if (isDryRun) {
    logger.info('🔍 Dry-run mode activated\n');
  }

  // Get available skills
  const availableSkills = getAvailableSkills();

  // Handle default mode (skip prompting)
  let options: SkillsGeneratorSchema & { dryRun?: boolean };

  if (schema.installMode === 'default') {
    // Skip prompting - use provided options or defaults
    options = {
      selectionMode: schema.selectionMode || 'all',
      skills: schema.skills || availableSkills,
      installationType: schema.installationType || 'global',
      force: schema.force || false,
      dry: schema.dry || false,
      installMode: 'default',
      dryRun: isDryRun,
    };
  } else {
    // Normal prompting flow
    const schemaPath = path.join(__dirname, 'schema.json');

    const skillDescriptions = Object.fromEntries(
      Object.entries(agnosticSkills).map(([key, value]) => [
        key,
        value.description,
      ])
    );

    options = (await promptForMissingOptions(
      { ...schema, 'no-interactive': noInteractive },
      schemaPath,
      {
        availableSkills,
        skillDescriptions,
      },
      explicitlyProvided
    )) as SkillsGeneratorSchema & { dryRun?: boolean };

    options.dryRun = isDryRun;
  }

  // Handle "install all" mode
  if (options.selectionMode === 'all') {
    options.skills = availableSkills;
  }

  // Validate skills selection
  const selectedSkills = options.skills || [];
  if (selectedSkills.length === 0) {
    logger.warn('\n⚠️  No skills selected for installation');
    return;
  }

  // Determine target directory
  const homeDir = os.homedir();
  const isGlobal = options.installationType === 'global';
  const targetDir = isGlobal
    ? path.join(homeDir, '.claude', 'skills')
    : path.join(process.cwd(), '.claude', 'skills');

  logger.info(`\n📦 Installing ${selectedSkills.length} skill(s)`);
  logger.info(`📍 Target: ${targetDir}\n`);

  const results: Array<{ skill: string; success: boolean; error?: string }> = [];

  // Install each skill
  for (const skillName of selectedSkills) {
    const skill = getSkillById(skillName);
    if (!skill) {
      logger.warn(`⚠️  Unknown skill: ${skillName}`);
      results.push({ skill: skillName, success: false, error: 'Unknown skill' });
      continue;
    }

    logger.info(`Installing: ${skillName}`);
    logger.info(`   ${skill.description}`);

    try {
      const skillTargetDir = path.join(targetDir, skillName);

      // Check if already installed
      if (!options.force && fs.existsSync(skillTargetDir)) {
        logger.info('   ✅ Already installed, skipping');
        results.push({ skill: skillName, success: true });
        continue;
      }

      if (options.dryRun) {
        logger.info(`   📁 [DRY-RUN] Would create: ${skillTargetDir}`);
        results.push({ skill: skillName, success: true });
        continue;
      }

      // Find skill source directory
      const skillSourceDir = await findSkillSourceDir(skillName);
      if (!skillSourceDir) {
        throw new Error(`Skill source directory not found for: ${skillName}`);
      }

      // Create skill directory and copy files
      await copySkillDirectory(skillSourceDir, skillTargetDir);

      logger.info(`   ✅ Installed to ${skillTargetDir}`);
      results.push({ skill: skillName, success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`   ❌ Failed: ${errorMessage}`);
      results.push({ skill: skillName, success: false, error: errorMessage });
    }
  }

  // Show summary
  logger.info('\n\n📊 Installation Summary');
  logger.info('======================\n');

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  logger.info(`✅ Successfully installed: ${successful.length}`);
  successful.forEach((r) => logger.info(`   • ${r.skill}`));

  if (failed.length > 0) {
    logger.info(`\n❌ Failed to install: ${failed.length}`);
    failed.forEach((r) =>
      logger.info(`   • ${r.skill} - ${r.error || 'Unknown error'}`)
    );
  }

  if (options.dryRun) {
    logger.info('\n✨ Dry-run complete! No changes were made.\n');
  } else {
    logger.info('\n✨ Skills installation complete!\n');
    showUsageInstructions(successful.map((r) => r.skill));
  }

  await formatFiles(tree);
}

/**
 * Find the source directory for a skill
 */
async function findSkillSourceDir(skillName: string): Promise<string | null> {
  // First check for bundled content (when running as standalone package)
  const bundledContentDir = path.join(
    __dirname,
    '..',
    '..',
    'content',
    'skills',
    'agnostic',
    skillName
  );

  if (fs.existsSync(bundledContentDir)) {
    return bundledContentDir;
  }

  // Fall back to workspace lookup
  const workspaceRoot = process.cwd();
  const workspaceSkillDir = path.join(
    workspaceRoot,
    'packages',
    'skills',
    'agnostic',
    'src',
    skillName
  );

  if (fs.existsSync(workspaceSkillDir)) {
    return workspaceSkillDir;
  }

  return null;
}

/**
 * Copy a skill directory to target location
 */
async function copySkillDirectory(
  sourceDir: string,
  targetDir: string
): Promise<void> {
  // Create target directory
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy all files recursively
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copySkillDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

/**
 * Show usage instructions after installation
 */
function showUsageInstructions(installedSkills: string[]): void {
  logger.info('📚 Using Your Skills');
  logger.info('====================\n');

  logger.info('Skills are automatically invoked by Claude when relevant.');
  logger.info('Claude will use the skill description to determine when to apply each skill.\n');

  logger.info('Installed skills:');
  installedSkills.forEach((skill) => {
    const skillInfo = getSkillById(skill);
    if (skillInfo) {
      logger.info(`   • ${skill}: ${skillInfo.description}`);
    }
  });

  logger.info('\n💡 Tips:');
  logger.info('   • Skills are model-invoked (Claude decides when to use them)');
  logger.info('   • Write clear skill descriptions to help Claude discover them');
  logger.info('   • Skills can include supporting files (docs, templates, examples)');
  logger.info('   • Check ~/.claude/skills/ for installed skills\n');
}

export { generator as skillsGenerator };
