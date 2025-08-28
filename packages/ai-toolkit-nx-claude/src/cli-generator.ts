#!/usr/bin/env node

/**
 * Unified CLI wrapper for all generators.
 * Determines which generator to run based on the script name.
 *
 * This single file handles all generator invocations:
 * - ai-toolkit-nx-claude -> defaults to init generator
 * - ai-toolkit-nx-claude:init -> init generator
 * - ai-toolkit-nx-claude:hooks -> hooks generator
 * - ai-toolkit-nx-claude:setup-registry-proxy -> setup-registry-proxy generator
 * - ai-toolkit-nx-claude:addons -> addons generator
 * - ai-toolkit-nx-claude:add-command -> add-command generator
 * - ai-toolkit-nx-claude:add-agent -> add-agent generator
 * - ai-toolkit-nx-claude:content-package -> content-package generator
 */

import { handleNxExecution } from './cli-utils';
import { prompt } from 'enquirer';

// Available generators (only show user-facing ones in interactive mode)
const GENERATORS = {
  init: 'One-shot installer for Claude Code configs',
  hooks: 'Install Claude Code notification hooks',
  addons: 'Install and configure Claude Code addons including MCP servers',
  'setup-registry-proxy':
    'Setup shell proxy for routing @uniswap/ai-toolkit* packages to GitHub registry',
};

// All generators including internal ones (for validation)
const ALL_GENERATORS = {
  ...GENERATORS,
  'add-command': 'Add a new Claude Code command to existing or new packages',
  'add-agent': 'Add a new Claude Code agent to existing or new packages',
  'content-package': 'Create a new content package for commands or agents',
};

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

  const choices = Object.entries(GENERATORS).map(([value, label]) => ({
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
  let processedArgs =
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
    console.log(
      '  npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude [generator]'
    );
    console.log('\nExamples:');
    console.log(
      '  npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude init'
    );
    console.log(
      '  npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude hooks'
    );
    process.exit(0);
  }

  // Show help message
  if (processedArgs.includes('--help') || processedArgs.includes('-h')) {
    if (generatorName) {
      console.log(
        `Usage: npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude ${generatorName}`
      );
      console.log(
        `\nThis command runs the nx-claude ${generatorName} generator.`
      );
    } else {
      console.log(
        'Usage: npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude [generator]'
      );
      console.log('\nRun without arguments for interactive mode.');
    }
    console.log('\nTo see all available generators, run with --list');
    console.log('\nTo run a specific generator:');
    console.log(
      '  npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude [generator]'
    );
    console.log('\nOptions are handled interactively during execution.');
    console.log('\nFor more information, see the package documentation.');
    process.exit(0);
  }

  // If no generator specified and no special flags, enter interactive mode
  if (!generatorName && processedArgs.length === 0) {
    generatorName = await selectGeneratorInteractively();
    console.log(''); // Empty line for spacing
  }

  // Ensure we have a generator name at this point
  if (!generatorName) {
    console.error('\n❌ No generator specified.');
    console.error(
      '\nUsage: npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude [generator]'
    );
    console.error('\nRun with --list to see available generators.');
    process.exit(1);
  }

  await handleNxExecution(generatorName, processedArgs);
}

main().catch(console.error);
