import type { Tree } from '@nx/devkit';
import { formatFiles, generateFiles, joinPathFragments } from '@nx/devkit';
import * as path from 'path';
import type { AddSkillGeneratorSchema } from './schema';
import { promptForMissingOptions } from '../../utils/prompt-utils';
import { libraryGenerator } from '@nx/js';

export async function addSkillGenerator(
  tree: Tree,
  options: AddSkillGeneratorSchema
) {
  console.log('⚡ Add Skill Generator');
  console.log('   Creates Claude Code skills compatible with the plugin system');

  // Discover existing skill packages
  const skillPackages = discoverSkillPackages(tree);

  // Add option for creating new package
  const packageChoices = [...skillPackages, '__create_new__'];

  // Get the schema path
  const schemaPath = path.join(__dirname, 'schema.json');

  // Prepare context for prompts with dynamic packages
  const context: any = {
    availablePackages: packageChoices,
  };

  // For non-interactive mode, default to first package if not specified
  if ((options as any)['no-interactive'] || (options as any).noInteractive) {
    if (!options.package && skillPackages.length > 0) {
      options.package = skillPackages[0];
    }
  }

  // Prompt for missing options (dynamic packages handled via context)
  const normalizedOptions = await promptForMissingOptions(
    options,
    schemaPath,
    context
  );

  // Handle package creation or selection
  let targetPackage: string;

  if (
    normalizedOptions.package === '__create_new__' ||
    normalizedOptions.createNewPackage
  ) {
    // Create new package
    if (!normalizedOptions.newPackageName) {
      throw new Error('New package name is required');
    }

    targetPackage = normalizedOptions.newPackageName;

    console.log(`\n📦 Creating new skills package: skills-${targetPackage}`);

    // Create the new package using Nx library generator
    await libraryGenerator(tree, {
      name: `skills-${targetPackage}`,
      directory: `packages/skills/${targetPackage}`,
      bundler: 'tsc',
      linter: 'eslint',
      unitTestRunner: 'jest',
      testEnvironment: 'node',
      skipFormat: true,
      skipTsConfig: false,
      strict: true,
      publishable: true,
      importPath: `@ai-toolkit/skills-${targetPackage}`,
    });

    // Create package.json content with nx targets
    const packageJson = {
      name: `@ai-toolkit/skills-${targetPackage}`,
      version: '0.1.0',
      private: true,
      type: 'module',
      main: './dist/src/index.js',
      types: './dist/src/index.d.ts',
      exports: {
        '.': {
          types: './dist/src/index.d.ts',
          import: './dist/src/index.js',
          default: './dist/src/index.js',
        },
        './package.json': './package.json',
      },
      nx: {
        targets: {
          'generate-index': {
            executor: 'nx:run-commands',
            options: {
              command: 'npx tsx scripts/generate.ts',
              cwd: `packages/skills/${targetPackage}`,
            },
            dependsOn: ['@ai-toolkit/utils:build'],
            inputs: [
              '{projectRoot}/src/**/*.md',
              '{projectRoot}/scripts/generate.ts',
            ],
            outputs: ['{projectRoot}/src/index.ts'],
          },
          build: {
            executor: '@nx/js:tsc',
            outputs: ['{options.outputPath}'],
            options: {
              outputPath: `packages/skills/${targetPackage}/dist`,
              main: `packages/skills/${targetPackage}/src/index.ts`,
              tsConfig: `packages/skills/${targetPackage}/tsconfig.lib.json`,
              assets: [
                {
                  input: `packages/skills/${targetPackage}/src`,
                  glob: '**/*.md',
                  output: '.',
                },
              ],
            },
            dependsOn: ['generate-index'],
          },
        },
      },
      dependencies: {
        '@ai-toolkit/utils': '*',
      },
    };

    tree.write(
      joinPathFragments('packages', 'skills', targetPackage, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create generate script
    const generateScript = `#!/usr/bin/env node

import { generateIndex } from '@ai-toolkit/utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const srcPath = join(__dirname, '..', 'src');
  const outputPath = join(srcPath, 'index.ts');

  await generateIndex({
    srcPath,
    outputPath,
    typeName: 'SkillName',
    exportName: 'skills',
    typeNamePlural: 'Skills',
    regenerateCommand:
      'npx nx run @ai-toolkit/skills-${targetPackage}:generate-index',
  });
}

main().catch((error) => {
  console.error('Failed to generate index:', error);
  process.exit(1);
});`;

    tree.write(
      joinPathFragments(
        'packages',
        'skills',
        targetPackage,
        'scripts',
        'generate.ts'
      ),
      generateScript
    );

    // Create tsconfig.lib.json
    const tsConfig = {
      extends: '../../../tsconfig.base.json',
      compilerOptions: {
        baseUrl: '.',
        rootDir: 'src',
        outDir: 'dist',
        tsBuildInfoFile: 'dist/tsconfig.lib.tsbuildinfo',
        emitDeclarationOnly: false,
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        target: 'es2022',
        forceConsistentCasingInFileNames: true,
        types: ['node'],
      },
      include: ['src/**/*.ts'],
      references: [
        {
          path: '../../utils/tsconfig.lib.json',
        },
      ],
    };

    tree.write(
      joinPathFragments(
        'packages',
        'skills',
        targetPackage,
        'tsconfig.lib.json'
      ),
      JSON.stringify(tsConfig, null, 2)
    );

    // Create README
    const readme = `# @ai-toolkit/skills-${targetPackage}

${normalizedOptions.newPackageDescription || `Claude Code skills for ${targetPackage}`}

## Overview

This package contains Claude Code skills specific to ${targetPackage}. Skills are model-invoked
capabilities that Claude autonomously decides when to use based on the task context.

## Skills vs Commands

- **Commands** (like \`/explore\`) are user-invoked via slash commands
- **Skills** are model-invoked - Claude decides when to use them based on the task

## Usage

Install this package to access ${targetPackage}-specific skills in Claude Code:

\`\`\`bash
npx nx generate @uniswap/ai-toolkit-nx-claude:init
\`\`\`

Then select skills from this package during installation, or install as a plugin.

## Available Skills

- \`${normalizedOptions.name}\`: ${normalizedOptions.description || 'Description pending'}

## Claude Code Plugin Integration

Skills from this package can be bundled into a Claude Code plugin. See the
[Claude Code plugins documentation](https://docs.anthropic.com/claude-code/plugins) for details.

## Development

To add new skills to this package:

\`\`\`bash
npx nx generate @uniswap/ai-toolkit-nx-claude:add-skill
\`\`\`

After adding or modifying skills, regenerate the index:

\`\`\`bash
npx nx run @ai-toolkit/skills-${targetPackage}:generate-index
\`\`\`
`;

    tree.write(
      joinPathFragments('packages', 'skills', targetPackage, 'README.md'),
      readme
    );
  } else {
    targetPackage = normalizedOptions.package!.replace('skills-', '');
  }

  // Generate the skill file
  const skillFileName = `${normalizedOptions.name}.md`;
  const skillPath = joinPathFragments('packages', 'skills', targetPackage, 'src');

  // Check if skill already exists
  if (tree.exists(joinPathFragments(skillPath, skillFileName))) {
    const overwrite = await promptForOverwrite(normalizedOptions.name!);
    if (!overwrite) {
      console.log('❌ Skill creation cancelled');
      return;
    }
  }

  // Generate files from template
  generateFiles(tree, path.join(__dirname, 'files'), skillPath, {
    ...normalizedOptions,
    name: normalizedOptions.name,
    description: normalizedOptions.description || `${normalizedOptions.name} skill`,
    allowedTools: normalizedOptions.allowedTools || '',
    template: '',
  });

  // Format files
  await formatFiles(tree);

  console.log(`\n✅ Skill file created at: ${skillPath}/${skillFileName}`);
  console.log('\n📝 Next steps:');
  console.log(`1. Edit ${skillPath}/${skillFileName} and add your skill instructions`);
  console.log('\n💡 The skill file has TODO markers for you to fill in.');
  console.log('\n🔌 Plugin Integration:');
  console.log('   Skills are automatically available when installed via the init generator');
  console.log('   or can be bundled into a Claude Code plugin for distribution.');

  // Schedule generate-index to run after the generator completes
  const { spawn } = await import('child_process');

  // Create a custom task that runs after file generation
  const runGenerateIndexTask = (tree: Tree) => {
    return () => {
      console.log(`\n🔄 Updating package index...`);
      return new Promise<void>((resolve) => {
        const child = spawn(
          'npx',
          ['nx', 'run', `@ai-toolkit/skills-${targetPackage}:generate-index`],
          {
            stdio: 'inherit',
            shell: true,
            cwd: tree.root,
          }
        );

        child.on('close', (code) => {
          if (code === 0) {
            console.log(`✅ Package index updated successfully`);
            resolve();
          } else {
            console.warn(
              `⚠️  Failed to update package index. You may need to run manually:`
            );
            console.warn(
              `   npx nx run @ai-toolkit/skills-${targetPackage}:generate-index`
            );
            // Don't reject - let the generator complete successfully
            resolve();
          }
        });

        child.on('error', (error) => {
          console.warn(`⚠️  Failed to update package index: ${error.message}`);
          console.warn(
            `   Run manually: npx nx run @ai-toolkit/skills-${targetPackage}:generate-index`
          );
          // Don't reject - let the generator complete successfully
          resolve();
        });
      });
    };
  };

  // Return the task to be executed after files are written
  return runGenerateIndexTask(tree);
}

function discoverSkillPackages(tree: Tree): string[] {
  const packages: string[] = [];
  const skillsDir = joinPathFragments('packages', 'skills');

  if (!tree.exists(skillsDir)) {
    return packages;
  }

  // Get all subdirectories under packages/skills
  const children = tree.children(skillsDir);

  for (const child of children) {
    const packagePath = joinPathFragments(skillsDir, child);
    // Check if it's a valid package (has package.json)
    if (tree.exists(joinPathFragments(packagePath, 'package.json'))) {
      packages.push(`skills-${child}`);
    }
  }

  return packages;
}

async function promptForOverwrite(name: string): Promise<boolean> {
  const { prompt } = await import('enquirer');
  const response = await prompt<{ overwrite: boolean }>({
    type: 'confirm',
    name: 'overwrite',
    message: `⚠️  Skill "${name}" already exists. Overwrite?`,
    initial: false,
  });
  return response.overwrite;
}

export default addSkillGenerator;
