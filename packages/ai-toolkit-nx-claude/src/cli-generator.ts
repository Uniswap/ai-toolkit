#!/usr/bin/env node

/**
 * Unified CLI wrapper for all generators.
 *
 * External Usage (npx @uniswap/ai-toolkit-nx-claude@latest):
 * - No arguments -> runs init generator (prompts for installMode)
 * - default -> runs init with --install-mode=default
 * - custom -> runs init with --install-mode=custom
 *
 * Internal Usage (from within ai-toolkit repo):
 * - No arguments -> shows interactive menu of all generators
 * - Specific generator name -> runs that generator
 *
 * This design ensures external users get a streamlined experience (init generator
 * with its schema-driven installMode prompt) while developers get access to all
 * generators including internal ones (add-command, add-agent).
 */

import { handleNxExecution } from './cli-utils';
import { prompt } from 'enquirer';
import * as path from 'path';
import * as fs from 'fs';

// Check if we're running from within the ai-toolkit repository
function isInAiToolkitRepo(): boolean {
  // Check if current working directory or script location is within ai-toolkit
  const cwd = process.cwd();
  const scriptPath = process.argv[1];

  // Check for ai-toolkit indicators
  const isInAiToolkit =
    cwd.includes('/ai-toolkit') ||
    scriptPath.includes('/ai-toolkit/') ||
    (fs.existsSync(path.join(cwd, 'package.json')) &&
      JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'))
        .name === '@ai-toolkit/source');

  return isInAiToolkit;
}

// Available generators (only show user-facing ones in interactive mode)
const GENERATORS = {
  default: 'Recommended setup with pre-selected components',
  custom: 'Choose exactly what to install',
};

// All generators including internal ones (for validation)
const ALL_GENERATORS = isInAiToolkitRepo()
  ? {
      ...GENERATORS,
      'add-command':
        'Add a new Claude Code command to existing or new packages',
      'add-agent': 'Add a new Claude Code agent to existing or new packages',
    }
  : GENERATORS;

// Extract generator name from arguments or return null for interactive mode
function getGeneratorName(args: string[]): string | null {
  // Check if first argument is a generator name (not a flag)
  if (args.length > 0 && !args[0].startsWith('-')) {
    const generatorName = args[0];
    // Validate it's a known generator (check against ALL generators)
    if (generatorName in ALL_GENERATORS) {
      return generatorName;
    }
    // If an invalid generator name was provided, show error
    console.error(`\n❌ Unknown generator: '${generatorName}'\n`);
    console.error('Available generators:');
    Object.entries(ALL_GENERATORS).forEach(([name, description]) => {
      console.error(`  • ${name}: ${description}`);
    });
    process.exit(1);
  }

  // Return null to trigger interactive mode
  return null;
}

// Interactive generator selection
async function selectGeneratorInteractively(): Promise<string> {
  console.log('\n🎯 AI Toolkit NX Claude Generator\n');
  console.log('Select a generator to run:\n');

  // Use ALL_GENERATORS for interactive mode when in ai-toolkit repo
  // Otherwise use GENERATORS (which excludes internal generators)
  const availableGenerators = isInAiToolkitRepo() ? ALL_GENERATORS : GENERATORS;

  const choices = Object.entries(availableGenerators).map(([value, label]) => ({
    message: `${value.padEnd(25)} - ${label}`,
    name: value, // name is the actual value that gets returned
  }));

  const response = await prompt<{ generator: string }>({
    type: 'select',
    name: 'generator',
    message: 'Which generator would you like to use?',
    choices,
  });

  return response.generator;
}

async function main() {
  const args = process.argv.slice(2);
  let generatorName = getGeneratorName(args);

  // Remove generator name from args if it was provided
  const processedArgs =
    args.length > 0 && !args[0].startsWith('-') && args[0] in ALL_GENERATORS
      ? args.slice(1)
      : args;

  // Show list of available generators
  if (processedArgs.includes('--list') || processedArgs.includes('-l')) {
    console.log('Available generators:\n');
    Object.entries(ALL_GENERATORS).forEach(([name, description]) => {
      console.log(`  ${name.padEnd(25)} ${description}`);
    });
    console.log('\nUsage:');
    console.log('  npx @uniswap/ai-toolkit-nx-claude@latest [generator]');
    console.log('\nExamples:');
    console.log('  npx @uniswap/ai-toolkit-nx-claude@latest default');
    console.log('  npx @uniswap/ai-toolkit-nx-claude@latest custom');
    process.exit(0);
  }

  // Show help message
  if (processedArgs.includes('--help') || processedArgs.includes('-h')) {
    if (generatorName) {
      console.log(
        `Usage: npx @uniswap/ai-toolkit-nx-claude@latest ${generatorName}`
      );
      console.log(
        `\nThis command runs the nx-claude ${generatorName} generator.`
      );
    } else {
      console.log(
        'Usage: npx @uniswap/ai-toolkit-nx-claude@latest [generator]'
      );
      console.log('\nRun without arguments for interactive mode.');
    }
    console.log('\nTo see all available generators, run with --list');
    console.log('\nTo run a specific generator:');
    console.log('  npx @uniswap/ai-toolkit-nx-claude@latest [generator]');
    console.log('\nOptions are handled interactively during execution.');
    console.log('\nFor more information, see the package documentation.');
    process.exit(0);
  }

  // If no generator specified and no special flags, default to init generator
  // The init generator's own schema will prompt for installation mode
  if (!generatorName && processedArgs.length === 0) {
    // Only show interactive menu if in ai-toolkit repo (for developers)
    if (isInAiToolkitRepo()) {
      generatorName = await selectGeneratorInteractively();
      console.log(''); // Empty line for spacing
    } else {
      // For external users, default to init generator
      generatorName = 'init';
    }
  }

  // Ensure we have a generator name at this point
  if (!generatorName) {
    console.error('\n❌ No generator specified.');
    console.error(
      '\nUsage: npx @uniswap/ai-toolkit-nx-claude@latest [generator]'
    );
    console.error('\nRun with --list to see available generators.');
    process.exit(1);
  }

  // Route default and custom to init generator with appropriate mode
  if (generatorName === 'default') {
    await handleNxExecution('init', [
      ...processedArgs,
      '--install-mode=default',
    ]);
  } else if (generatorName === 'custom') {
    await handleNxExecution('init', [
      ...processedArgs,
      '--install-mode=custom',
    ]);
  } else {
    await handleNxExecution(generatorName, processedArgs);
  }
}

main().catch(console.error);
