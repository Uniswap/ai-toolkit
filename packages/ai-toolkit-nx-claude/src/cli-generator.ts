#!/usr/bin/env node

/**
 * Unified CLI wrapper for ai-toolkit-nx-claude generators.
 *
 * Available generators:
 * - addons: Install and configure Claude Code addons including MCP servers
 *
 * Usage:
 * - No arguments -> shows interactive menu of generators
 * - Specific generator name -> runs that generator
 *
 * Note: The init, add-command, add-agent, and hooks generators have been removed.
 * For Claude Code setup, use the marketplace-based plugin architecture instead.
 */

import { handleNxExecution } from './cli-utils';
import { prompt } from 'enquirer';

// Available generators
const GENERATORS: Record<string, string> = {
  addons: 'Install and configure Claude Code addons including MCP servers',
};

// Extract generator name from arguments or return null for interactive mode
function getGeneratorName(args: string[]): string | null {
  // Check if first argument is a generator name (not a flag)
  if (args.length > 0 && !args[0].startsWith('-')) {
    const generatorName = args[0];
    // Validate it's a known generator
    if (generatorName in GENERATORS) {
      return generatorName;
    }
    // If an invalid generator name was provided, show error
    console.error(`\n❌ Unknown generator: '${generatorName}'\n`);
    console.error('Available generators:');
    Object.entries(GENERATORS).forEach(([name, description]) => {
      console.error(`  • ${name}: ${description}`);
    });
    console.error(
      '\nNote: The init, hooks, and other generators have been removed. Use the marketplace-based plugin architecture instead.'
    );
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
    message: `${value.padEnd(15)} - ${label}`,
    name: value,
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
    args.length > 0 && !args[0].startsWith('-') && args[0] in GENERATORS ? args.slice(1) : args;

  // Show list of available generators
  if (processedArgs.includes('--list') || processedArgs.includes('-l')) {
    console.log('Available generators:\n');
    Object.entries(GENERATORS).forEach(([name, description]) => {
      console.log(`  ${name.padEnd(15)} ${description}`);
    });
    console.log('\nUsage:');
    console.log('  npx @uniswap/ai-toolkit-nx-claude@latest [generator]');
    console.log('\nExamples:');
    console.log('  npx @uniswap/ai-toolkit-nx-claude@latest addons');
    console.log(
      '\nNote: The init, hooks, and other generators have been removed. Use the marketplace-based plugin architecture instead.'
    );
    process.exit(0);
  }

  // Show help message
  if (processedArgs.includes('--help') || processedArgs.includes('-h')) {
    if (generatorName) {
      console.log(`Usage: npx @uniswap/ai-toolkit-nx-claude@latest ${generatorName}`);
      console.log(`\nThis command runs the nx-claude ${generatorName} generator.`);
    } else {
      console.log('Usage: npx @uniswap/ai-toolkit-nx-claude@latest [generator]');
      console.log('\nRun without arguments for interactive mode.');
    }
    console.log('\nTo see all available generators, run with --list');
    console.log('\nTo run a specific generator:');
    console.log('  npx @uniswap/ai-toolkit-nx-claude@latest [generator]');
    console.log('\nOptions are handled interactively during execution.');
    console.log(
      '\nNote: The init, hooks, and other generators have been removed. Use the marketplace-based plugin architecture instead.'
    );
    process.exit(0);
  }

  // If no generator specified and no special flags, show interactive menu
  if (!generatorName && processedArgs.length === 0) {
    generatorName = await selectGeneratorInteractively();
    console.log(''); // Empty line for spacing
  }

  // Ensure we have a generator name at this point
  if (!generatorName) {
    console.error('\n❌ No generator specified.');
    console.error('\nUsage: npx @uniswap/ai-toolkit-nx-claude@latest [generator]');
    console.error('\nRun with --list to see available generators.');
    process.exit(1);
  }

  await handleNxExecution(generatorName, processedArgs);
}

main().catch(console.error);
