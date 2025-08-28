import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Authentication status for GitHub packages
 */
export interface AuthStatus {
  /** Whether authentication is configured */
  authenticated: boolean;
  /** Authentication method used */
  method?: 'npmrc' | 'env' | 'none';
  /** Registry URL configured */
  registry?: string;
  /** Whether the token is valid */
  valid?: boolean;
  /** Error message if authentication failed */
  error?: string;
}

/**
 * Check if GitHub authentication is configured
 */
export async function checkGitHubAuth(): Promise<AuthStatus> {
  // Check environment variable first
  if (process.env.NPM_TOKEN || process.env.GITHUB_TOKEN) {
    const token = process.env.NPM_TOKEN || process.env.GITHUB_TOKEN;
    const valid = await validateToken(token!);
    return {
      authenticated: true,
      method: 'env',
      registry: 'https://npm.pkg.github.com',
      valid,
    };
  }

  // Check npmrc files (global and local)
  const npmrcPaths = [join(homedir(), '.npmrc'), join(process.cwd(), '.npmrc')];

  for (const npmrcPath of npmrcPaths) {
    if (existsSync(npmrcPath)) {
      const content = readFileSync(npmrcPath, 'utf-8');

      // Look for GitHub registry configuration
      if (content.includes('//npm.pkg.github.com/:_authToken=')) {
        // Extract token and validate
        const tokenMatch = content.match(
          /\/\/npm\.pkg\.github\.com\/:_authToken=(.+)/
        );
        if (tokenMatch) {
          const token = tokenMatch[1].trim();
          const valid = await validateToken(token);
          return {
            authenticated: true,
            method: 'npmrc',
            registry: 'https://npm.pkg.github.com',
            valid,
          };
        }
      }
    }
  }

  return {
    authenticated: false,
    method: 'none',
  };
}

/**
 * Validate a GitHub token by attempting to access a package
 */
async function validateToken(token: string): Promise<boolean> {
  try {
    // Try to access package info using the token
    const result = execSync(
      `npm view @uniswap/spec-workflow-mcp --@uniswap:registry=https://npm.pkg.github.com --//npm.pkg.github.com/:_authToken=${token} --json`,
      {
        encoding: 'utf-8',
        stdio: 'pipe',
      }
    );

    // If we get here without error, token is valid
    return result.includes('"name"');
  } catch (error) {
    // Token is invalid or package doesn't exist
    return false;
  }
}

/**
 * Setup GitHub authentication
 */
export async function setupGitHubAuth(
  token: string,
  location: 'global' | 'local' = 'global'
): Promise<AuthStatus> {
  // Validate token first
  const valid = await validateToken(token);
  if (!valid) {
    return {
      authenticated: false,
      method: 'none',
      error:
        'Invalid GitHub token. Please ensure you have a valid personal access token with read:packages scope.',
    };
  }

  // Determine npmrc path
  const npmrcPath =
    location === 'global'
      ? join(homedir(), '.npmrc')
      : join(process.cwd(), '.npmrc');

  // Registry configuration lines
  const registryLines = [`//npm.pkg.github.com/:_authToken=${token}`];

  // Read existing npmrc or create new content
  let npmrcContent = '';
  if (existsSync(npmrcPath)) {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');

    // Check if GitHub registry is already configured

    const hasToken = npmrcContent.includes('//npm.pkg.github.com/:_authToken=');

    if (hasToken) {
      // Update existing token
      npmrcContent = npmrcContent.replace(
        /\/\/npm\.pkg\.github\.com\/:_authToken=.*/,
        `//npm.pkg.github.com/:_authToken=${token}`
      );
    } else {
      // Add missing lines
      if (!hasToken) {
        npmrcContent += '\n' + registryLines[1];
      }
    }
  } else {
    // Create new npmrc with GitHub registry config
    npmrcContent = registryLines.join('\n') + '\n';
  }

  // Write updated npmrc
  writeFileSync(npmrcPath, npmrcContent);

  return {
    authenticated: true,
    method: 'npmrc',
    registry: 'https://npm.pkg.github.com',
    valid: true,
  };
}

/**
 * Validate package access with current authentication
 */
export async function validatePackageAccess(
  packageName: string = '@uniswap/spec-workflow-mcp'
): Promise<{
  accessible: boolean;
  error?: string;
  version?: string;
}> {
  try {
    // Check if we have authentication
    const authStatus = await checkGitHubAuth();
    if (!authStatus.authenticated) {
      return {
        accessible: false,
        error:
          'No GitHub authentication configured. Please provide a personal access token.',
      };
    }

    // Try to access the package
    let command = `npm view ${packageName} version --@uniswap:registry=https://npm.pkg.github.com`;

    // Add auth token if using environment variable
    if (
      authStatus.method === 'env' &&
      (process.env.NPM_TOKEN || process.env.GITHUB_TOKEN)
    ) {
      const token = process.env.NPM_TOKEN || process.env.GITHUB_TOKEN;
      command += ` --//npm.pkg.github.com/:_authToken=${token}`;
    }

    const version = execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();

    return {
      accessible: true,
      version,
    };
  } catch (error: any) {
    // Parse error for better messaging
    let errorMessage = 'Failed to access package';

    if (error.message?.includes('404')) {
      errorMessage = `Package ${packageName} not found. Ensure you have access to the Uniswap organization.`;
    } else if (
      error.message?.includes('401') ||
      error.message?.includes('403')
    ) {
      errorMessage =
        'Authentication failed. Please check your GitHub token has read:packages scope.';
    } else if (error.message?.includes('ENOTFOUND')) {
      errorMessage = 'Network error. Please check your internet connection.';
    }

    return {
      accessible: false,
      error: errorMessage,
    };
  }
}

/**
 * Get authentication instructions for the user
 */
export function getAuthInstructions(): string {
  return `
To access @uniswap packages from GitHub Packages, you need a personal access token:

1. Go to https://github.com/settings/tokens/new
2. Create a token with 'read:packages' scope
3. Copy the generated token

The token will be saved to your ~/.npmrc file for future use.

For more information, see: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry
  `.trim();
}
