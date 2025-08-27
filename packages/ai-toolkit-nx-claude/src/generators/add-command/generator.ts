import {
  Tree,
  formatFiles,
  generateFiles,
  joinPathFragments,
} from '@nx/devkit';
import * as path from 'path';
import { AddCommandGeneratorSchema } from './schema';
import { promptForMissingOptions } from '../../utils/prompt-utils';
import { libraryGenerator } from '@nx/js';

export async function addCommandGenerator(
  tree: Tree,
  options: AddCommandGeneratorSchema
) {
  console.log('⚡ Add Command Generator');

  // Discover existing command packages
  const commandPackages = discoverCommandPackages(tree);

  // Add option for creating new package
  const packageChoices = [...commandPackages, '__create_new__'];

  // Get the schema path
  const schemaPath = path.join(__dirname, 'schema.json');

  // Prepare context for prompts with dynamic packages
  const context: any = {
    availablePackages: packageChoices,
  };

  // For non-interactive mode, default to first package if not specified
  if ((options as any)['no-interactive'] || (options as any).noInteractive) {
    if (!options.package && commandPackages.length > 0) {
      options.package = commandPackages[0];
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

    console.log(
      `\n📦 Creating new commands package: commands-${targetPackage}`
    );

    // Create the new package using Nx library generator
    await libraryGenerator(tree, {
      name: `commands-${targetPackage}`,
      directory: `packages/commands/${targetPackage}`,
      bundler: 'tsc',
      linter: 'eslint',
      unitTestRunner: 'jest',
      testEnvironment: 'node',
      skipFormat: true,
      skipTsConfig: false,
      strict: true,
      publishable: true,
      importPath: `@ai-toolkit/commands-${targetPackage}`,
    });

    // Create package.json content
    const packageJson = {
      name: `@ai-toolkit/commands-${targetPackage}`,
      version: '0.0.1',
      description:
        normalizedOptions.newPackageDescription ||
        `Command configurations for ${targetPackage}`,
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      scripts: {
        build: 'tsc',
        'generate-index': 'tsx scripts/generate.ts',
      },
      dependencies: {
        '@ai-toolkit/utils': '*',
      },
      devDependencies: {
        tsx: '^4.7.0',
        typescript: '^5.3.3',
      },
    };

    tree.write(
      joinPathFragments('packages', 'commands', targetPackage, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create generate script
    const generateScript = `import { generateIndex } from '@ai-toolkit/utils';
import * as path from 'path';

generateIndex({
  sourceDir: path.join(__dirname, '../src'),
  outputFile: path.join(__dirname, '../src/index.ts'),
  type: 'commands',
});`;

    tree.write(
      joinPathFragments(
        'packages',
        'commands',
        targetPackage,
        'scripts',
        'generate.ts'
      ),
      generateScript
    );

    // Create README
    const readme = `# @ai-toolkit/commands-${targetPackage}

${
  normalizedOptions.newPackageDescription ||
  `Command configurations for ${targetPackage}`
}

## Overview

This package contains command configurations specific to ${targetPackage}.

## Usage

Install this package to access ${targetPackage}-specific commands in Claude Code:

\`\`\`bash
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:init
\`\`\`

Then select the commands from this package during the installation process.

## Available Commands

- \`${normalizedOptions.name}\`: ${
      normalizedOptions.description || 'Description pending'
    }

## Development

To add new commands to this package:

\`\`\`bash
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:add-command
\`\`\`

After adding or modifying commands, regenerate the index:

\`\`\`bash
bunx nx run @ai-toolkit/commands-${targetPackage}:generate-index
\`\`\``;

    tree.write(
      joinPathFragments('packages', 'commands', targetPackage, 'README.md'),
      readme
    );
  } else {
    targetPackage = normalizedOptions.package!.replace('commands-', '');
  }

  // Generate the command file
  const commandFileName = `${normalizedOptions.name}.md`;
  const commandPath = joinPathFragments(
    'packages',
    'commands',
    targetPackage,
    'src'
  );

  // Check if command already exists
  if (tree.exists(joinPathFragments(commandPath, commandFileName))) {
    const overwrite = await promptForOverwrite(normalizedOptions.name);
    if (!overwrite) {
      console.log('❌ Command creation cancelled');
      return;
    }
  }

  // Generate files from template
  generateFiles(tree, path.join(__dirname, 'files'), commandPath, {
    ...normalizedOptions,
    name: normalizedOptions.name,
    description:
      normalizedOptions.description || `${normalizedOptions.name} command`,
    template: '',
  });

  // Format files
  await formatFiles(tree);

  console.log(
    `\n✅ Command file created at: ${commandPath}/${commandFileName}`
  );
  console.log('\n📝 Next steps:');
  console.log(
    `1. Edit ${commandPath}/${commandFileName} and add your command instructions`
  );
  console.log(
    '\n💡 The command file has TODO markers for you to fill in with your specific instructions.'
  );

  // Schedule generate-index to run after the generator completes
  const { spawn } = await import('child_process');

  // Create a custom task that runs after file generation
  const runGenerateIndexTask = (tree: Tree) => {
    return () => {
      console.log(`\n🔄 Updating package index...`);
      return new Promise<void>((resolve) => {
        const child = spawn(
          'bunx',
          ['nx', 'run', `@ai-toolkit/commands-${targetPackage}:generate-index`],
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
              `   bunx nx run @ai-toolkit/commands-${targetPackage}:generate-index`
            );
            // Don't reject - let the generator complete successfully
            resolve();
          }
        });

        child.on('error', (error) => {
          console.warn(`⚠️  Failed to update package index: ${error.message}`);
          console.warn(
            `   Run manually: bunx nx run @ai-toolkit/commands-${targetPackage}:generate-index`
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

function discoverCommandPackages(tree: Tree): string[] {
  const packages: string[] = [];
  const commandsDir = joinPathFragments('packages', 'commands');

  if (!tree.exists(commandsDir)) {
    return packages;
  }

  // Get all subdirectories under packages/commands
  const children = tree.children(commandsDir);

  for (const child of children) {
    const packagePath = joinPathFragments(commandsDir, child);
    // Check if it's a valid package (has package.json)
    if (tree.exists(joinPathFragments(packagePath, 'package.json'))) {
      packages.push(`commands-${child}`);
    }
  }

  return packages;
}

async function promptForOverwrite(name: string): Promise<boolean> {
  const { prompt } = await import('enquirer');
  const response = await prompt<{ overwrite: boolean }>({
    type: 'confirm',
    name: 'overwrite',
    message: `⚠️  Command "${name}" already exists. Overwrite?`,
    initial: false,
  });
  return response.overwrite;
}

export default addCommandGenerator;
