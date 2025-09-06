import type { Tree } from '@nx/devkit';
import { formatFiles, generateFiles, joinPathFragments } from '@nx/devkit';
import * as path from 'path';
import type { AddAgentGeneratorSchema } from './schema';
import { promptForMissingOptions } from '../../utils/prompt-utils';
import { libraryGenerator } from '@nx/js';

export async function addAgentGenerator(
  tree: Tree,
  options: AddAgentGeneratorSchema
) {
  console.log('🤖 Add Agent Generator');

  // Discover existing agent packages
  const agentPackages = discoverAgentPackages(tree);

  // Add option for creating new package
  const packageChoices = [...agentPackages, '__create_new__'];

  // Get the schema path
  const schemaPath = path.join(__dirname, 'schema.json');

  // Prepare context for prompts with dynamic packages
  const context: any = {
    availablePackages: packageChoices,
  };

  // For non-interactive mode, default to first package if not specified
  if ((options as any)['no-interactive'] || (options as any).noInteractive) {
    if (!options.package && agentPackages.length > 0) {
      options.package = agentPackages[0];
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

    console.log(`\n📦 Creating new agents package: agents-${targetPackage}`);

    // Create the new package using Nx library generator
    await libraryGenerator(tree, {
      name: `agents-${targetPackage}`,
      directory: `packages/agents/${targetPackage}`,
      bundler: 'tsc',
      linter: 'eslint',
      unitTestRunner: 'jest',
      testEnvironment: 'node',
      skipFormat: true,
      skipTsConfig: false,
      strict: true,
      publishable: true,
      importPath: `@ai-toolkit/agents-${targetPackage}`,
    });

    // Create package.json content
    const packageJson = {
      name: `@ai-toolkit/agents-${targetPackage}`,
      version: '0.0.1',
      description:
        normalizedOptions.newPackageDescription ||
        `Agent configurations for ${targetPackage}`,
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
      joinPathFragments('packages', 'agents', targetPackage, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create generate script
    const generateScript = `import { generateIndex } from '@ai-toolkit/utils';
import * as path from 'path';

generateIndex({
  sourceDir: path.join(__dirname, '../src'),
  outputFile: path.join(__dirname, '../src/index.ts'),
  type: 'agents',
});`;

    tree.write(
      joinPathFragments(
        'packages',
        'agents',
        targetPackage,
        'scripts',
        'generate.ts'
      ),
      generateScript
    );

    // Create README
    const readme = `# @ai-toolkit/agents-${targetPackage}

${
  normalizedOptions.newPackageDescription ||
  `Agent configurations for ${targetPackage}`
}

## Overview

This package contains agent configurations specific to ${targetPackage}.

## Usage

Install this package to access ${targetPackage}-specific agents in Claude Code:

\`\`\`bash
bunx nx generate @uniswap/ai-toolkit-nx-claude:init
\`\`\`

Then select the agents from this package during the installation process.

## Available Agents

- \`${normalizedOptions.name}\`: ${
      normalizedOptions.description || 'Description pending'
    }

## Development

To add new agents to this package:

\`\`\`bash
bunx nx generate @uniswap/ai-toolkit-nx-claude:add-agent
\`\`\`

After adding or modifying agents, regenerate the index:

\`\`\`bash
bunx nx run @ai-toolkit/agents-${targetPackage}:generate-index
\`\`\``;

    tree.write(
      joinPathFragments('packages', 'agents', targetPackage, 'README.md'),
      readme
    );
  } else {
    targetPackage = normalizedOptions.package!.replace('agents-', '');
  }

  // Generate the agent file
  const agentFileName = `${normalizedOptions.name}.md`;
  const agentPath = joinPathFragments(
    'packages',
    'agents',
    targetPackage,
    'src'
  );

  // Check if agent already exists
  if (tree.exists(joinPathFragments(agentPath, agentFileName))) {
    const overwrite = await promptForOverwrite(normalizedOptions.name);
    if (!overwrite) {
      console.log('❌ Agent creation cancelled');
      return;
    }
  }

  // Generate files from template
  generateFiles(tree, path.join(__dirname, 'files'), agentPath, {
    ...normalizedOptions,
    name: normalizedOptions.name,
    description:
      normalizedOptions.description || `${normalizedOptions.name} agent`,
    model: normalizedOptions.model,
    template: '',
  });

  // Format files
  await formatFiles(tree);

  console.log(`\n✅ Agent file created at: ${agentPath}/${agentFileName}`);
  console.log('\n📝 Next steps:');
  console.log(
    `1. Edit ${agentPath}/${agentFileName} and add your agent instructions`
  );
  console.log(
    '\n💡 The agent file has TODO markers for you to fill in with your specific instructions.'
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
          ['nx', 'run', `@ai-toolkit/agents-${targetPackage}:generate-index`],
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
              `   bunx nx run @ai-toolkit/agents-${targetPackage}:generate-index`
            );
            // Don't reject - let the generator complete successfully
            resolve();
          }
        });

        child.on('error', (error) => {
          console.warn(`⚠️  Failed to update package index: ${error.message}`);
          console.warn(
            `   Run manually: bunx nx run @ai-toolkit/agents-${targetPackage}:generate-index`
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

function discoverAgentPackages(tree: Tree): string[] {
  const packages: string[] = [];
  const agentsDir = joinPathFragments('packages', 'agents');

  if (!tree.exists(agentsDir)) {
    return packages;
  }

  // Get all subdirectories under packages/agents
  const children = tree.children(agentsDir);

  for (const child of children) {
    const packagePath = joinPathFragments(agentsDir, child);
    // Check if it's a valid package (has package.json)
    if (tree.exists(joinPathFragments(packagePath, 'package.json'))) {
      packages.push(`agents-${child}`);
    }
  }

  return packages;
}

async function promptForOverwrite(name: string): Promise<boolean> {
  const { prompt } = await import('enquirer');
  const response = await prompt<{ overwrite: boolean }>({
    type: 'confirm',
    name: 'overwrite',
    message: `⚠️  Agent "${name}" already exists. Overwrite?`,
    initial: false,
  });
  return response.overwrite;
}

export default addAgentGenerator;
