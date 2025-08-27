#!/usr/bin/env node

/**
 * Simple CLI wrapper for the nx-claude init generator.
 * This allows the package to be run directly via npx or bunx.
 */

async function main() {
  const args = process.argv.slice(2);

  // Show help message
  if (args.includes('--help') || args.includes('-h')) {
    console.log(
      'Usage: npx --registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude'
    );
    console.log(
      '\nThis command runs the nx-claude init generator to install Claude Code configurations.'
    );
    console.log('\nOptions are handled interactively during execution.');
    console.log('\nFor more information, see the package documentation.');
    process.exit(0);
  }

  // Import and run the Nx CLI to execute the generator
  try {
    const { execSync } = await import('child_process');

    // Build the nx command with all provided arguments
    const nxArgs = [
      'nx',
      'generate',
      '@uniswap/ai-toolkit-nx-claude:init',
      ...args,
    ];

    // Execute the nx command
    execSync(nxArgs.join(' '), {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error: any) {
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
        '1. Ensure you are logged into npm with: npm login --registry=https://npm.pkg.github.com'
      );
      console.error(
        '2. Verify you are a member of the Uniswap organization on GitHub'
      );
      console.error(
        '3. Check that your npm token has the required "read:packages" scope'
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
      console.error('2. You are not authenticated properly');
      console.error('3. Your npm registry is not configured correctly');
      console.error('\nTry running:');
      console.error('  npm login --registry=https://npm.pkg.github.com');
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
      console.error('  npx nx generate @uniswap/ai-toolkit-nx-claude:init');
      console.error(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      );
    } else {
      // For other errors, just exit with the error code
      process.exit(error.status || 1);
    }
    process.exit(1);
  }
}

main().catch(console.error);
