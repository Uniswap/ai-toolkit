#!/usr/bin/env node

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Handles the execution of an Nx generator with proper error handling
 */
export async function handleNxExecution(generatorName: string, args: string[]) {
  // Show help message if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log(
      `Usage: npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude:${generatorName}`
    );
    console.log(
      `\nThis command runs the nx-claude ${generatorName} generator.`
    );
    console.log('\nOptions are handled interactively during execution.');
    console.log('\nFor more information, see the package documentation.');
    process.exit(0);
  }

  // Determine if we should run in standalone mode
  const isStandalone = shouldRunStandalone();

  if (isStandalone) {
    // Run generator directly without Nx context
    await runGeneratorDirectly(generatorName, args);
  } else {
    // Execute through nx command (when in ai-toolkit workspace)
    try {
      const nxArgs = [
        'nx',
        'generate',
        `@uniswap/ai-toolkit-nx-claude:${generatorName}`,
        ...args,
      ];

      execSync(nxArgs.join(' '), {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    } catch (error: any) {
      handleExecutionError(error, generatorName);
    }
  }
}

function handleExecutionError(error: any, generatorName: string) {
  // Check for authentication errors
  if (
    error.code === '403' ||
    error.message?.includes('Forbidden') ||
    error.message?.includes('unauthorized')
  ) {
    console.error('\n❌ Authentication Error');
    console.error(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    );
    console.error('You do not have permission to access this package.');
    console.error(
      '\nThis package is restricted to members of the Uniswap GitHub organization.'
    );
    console.error('\nTo gain access:');
    console.error(
      '1. Verify you are a member of the Uniswap organization on GitHub'
    );
    console.error(
      '2. Check that your npm token has the required "read:packages" scope'
    );
    console.error(
      '\nFor more information, see: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages'
    );
    console.error(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    );
  } else if (error.code === '404' || error.message?.includes('Not Found')) {
    console.error('\n❌ Package Not Found');
    console.error(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    );
    console.error(
      'The package @uniswap/ai-toolkit-nx-claude could not be found.'
    );
    console.error('\nThis may be because:');
    console.error('1. The package has not been published yet');
    console.error(
      '2. You are not authenticated properly (check your GitHub PAT)'
    );
    console.error('\nTry running:');
    console.error(
      '  echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc'
    );
    console.error(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    );
  } else if (error.code === 'ENOENT') {
    console.error('\n❌ Nx CLI Not Found');
    console.error(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    );
    console.error('The Nx CLI is required but not installed.');
    console.error('\nPlease install Nx globally:');
    console.error('  npm install -g nx');
    console.error('\nOr use npx to run without installing:');
    console.error(
      `  npx nx generate @uniswap/ai-toolkit-nx-claude:${generatorName}`
    );
    console.error(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    );
  } else {
    // For other errors, just exit with the error code
    process.exit(error.status || 1);
  }
  process.exit(1);
}

/**
 * Determines if the CLI should run in standalone mode (without Nx context)
 */
function shouldRunStandalone(): boolean {
  // Check if we're running from within the ai-toolkit workspace itself
  const scriptPath = process.argv[1];
  const isInAiToolkitWorkspace = scriptPath.includes(
    '/ai-toolkit/packages/ai-toolkit-nx-claude/'
  );

  // If we're not in the ai-toolkit workspace, run standalone
  if (!isInAiToolkitWorkspace) {
    return true;
  }

  // If we are in ai-toolkit but running from a different directory, check for nx.json
  const cwd = process.cwd();
  const hasNxJson = fs.existsSync(path.join(cwd, 'nx.json'));

  // Only run through Nx if we're in the ai-toolkit workspace root
  return !hasNxJson || !cwd.includes('/ai-toolkit');
}

/**
 * Runs a generator directly without going through Nx's generate command
 */
async function runGeneratorDirectly(generatorName: string, args: string[]) {
  try {
    // Use require for CommonJS modules
    const generatorPath = path.join(
      __dirname,
      'generators',
      generatorName,
      'generator.js'
    );

    // Use require for CommonJS compatibility
    const generatorModule = require(generatorPath);

    // Handle both default and named exports
    // Generators export named functions like 'initGenerator', 'hooksGenerator', etc.
    const generatorFnName = `${generatorName}Generator`;
    const generator =
      generatorModule.default ||
      generatorModule[generatorFnName] ||
      generatorModule;

    if (!generator || typeof generator !== 'function') {
      throw new Error(`Generator function not found for '${generatorName}'`);
    }

    // Parse CLI args into options
    const options = parseCliArgs(args);

    // Create a minimal tree interface for file operations
    const tree = createStandaloneTree();

    // Run the generator
    await generator(tree, options);

    // Apply changes
    await applyTreeChanges(tree);
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error(`\n❌ Generator '${generatorName}' not found`);
      console.error(
        'Available generators: init, hooks, setup-registry-proxy, addons, add-command, add-agent'
      );
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Parse CLI arguments into an options object
 */
function parseCliArgs(args: string[]): Record<string, any> {
  const options: Record<string, any> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      let key = arg.slice(2);
      const nextArg = args[i + 1];

      // Handle key=value format
      let value: any = true;
      if (key.includes('=')) {
        const [k, v] = key.split('=');
        key = k;
        value = v;
      } else if (nextArg && !nextArg.startsWith('--')) {
        value = nextArg;
        i++; // Skip next arg since we consumed it
      }

      // Convert kebab-case to camelCase
      const camelKey = key.replace(/-([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );

      // Handle negations (--no-interactive -> nonInteractive: true)
      if (camelKey.startsWith('no') && camelKey.length > 2) {
        const actualKey = camelKey[2].toLowerCase() + camelKey.slice(3);
        // Special case for noInteractive/nonInteractive
        if (actualKey === 'interactive') {
          options['nonInteractive'] = true;
        } else {
          options[actualKey] = false;
        }
      } else {
        options[camelKey] = value;
      }
    }
  }

  return options;
}

/**
 * Creates a minimal tree interface for standalone execution
 */
function createStandaloneTree() {
  const changes = new Map<
    string,
    { content: string; mode?: 'create' | 'update' | 'delete' }
  >();

  return {
    root: process.cwd(),
    read(filePath: string): Buffer | null {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath);
      }
      return null;
    },
    write(filePath: string, content: string | Buffer) {
      changes.set(filePath, { content: content.toString(), mode: 'update' });
    },
    exists(filePath: string): boolean {
      const fullPath = path.join(process.cwd(), filePath);
      return fs.existsSync(fullPath);
    },
    delete(filePath: string) {
      changes.set(filePath, { content: '', mode: 'delete' });
    },
    isFile(filePath: string): boolean {
      const fullPath = path.join(process.cwd(), filePath);
      return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
    },
    children(dirPath: string): string[] {
      const fullPath = path.join(process.cwd(), dirPath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        return fs.readdirSync(fullPath);
      }
      return [];
    },
    // Store changes for later application
    _changes: changes,
  };
}

/**
 * Apply the changes from the tree to the file system
 */
async function applyTreeChanges(tree: any) {
  for (const [filePath, change] of tree._changes.entries()) {
    const fullPath = path.join(process.cwd(), filePath);

    if (change.mode === 'delete') {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } else {
      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the file
      fs.writeFileSync(fullPath, change.content);
    }
  }
}
