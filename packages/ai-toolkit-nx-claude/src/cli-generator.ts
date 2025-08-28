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
import * as path from 'path';

// Available generators
const GENERATORS = {
  init: 'One-shot installer for Claude Code configs',
  hooks: 'Install Claude Code notification hooks',
  'setup-registry-proxy':
    'Setup shell proxy for routing @uniswap/ai-toolkit* packages to GitHub registry',
  addons: 'Install and configure Claude Code addons including MCP servers',
  'add-command': 'Add a new Claude Code command to existing or new packages',
  'add-agent': 'Add a new Claude Code agent to existing or new packages',
  'content-package': 'Create a new content package for commands or agents',
};

// Extract generator name from the script name
function getGeneratorName(): string {
  const scriptName = path.basename(process.argv[1]);

  // Handle colon-syntax: ai-toolkit-nx-claude:generator-name
  const colonIndex = scriptName.lastIndexOf(':');
  if (colonIndex !== -1) {
    return scriptName.substring(colonIndex + 1);
  }

  // Default to init if no generator specified
  return 'init';
}

async function main() {
  const args = process.argv.slice(2);

  // Show list of available generators
  if (args.includes('--list') || args.includes('-l')) {
    console.log('Available generators:\n');
    Object.entries(GENERATORS).forEach(([name, description]) => {
      console.log(`  ${name.padEnd(25)} ${description}`);
    });
    console.log('\nUsage:');
    console.log(
      '  npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude:[generator]'
    );
    console.log('\nExample:');
    console.log(
      '  npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude:hooks'
    );
    process.exit(0);
  }

  // Show help message
  if (args.includes('--help') || args.includes('-h')) {
    const generatorName = getGeneratorName();
    console.log(
      `Usage: npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude${
        generatorName !== 'init' ? ':' + generatorName : ''
      }`
    );
    console.log(
      `\nThis command runs the nx-claude ${generatorName} generator.`
    );
    console.log('\nTo see all available generators, run with --list');
    console.log('\nTo run a specific generator:');
    console.log(
      '  npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude:[generator]'
    );
    console.log('\nOptions are handled interactively during execution.');
    console.log('\nFor more information, see the package documentation.');
    process.exit(0);
  }

  const generatorName = getGeneratorName();
  await handleNxExecution(generatorName, args);
}

main().catch(console.error);
