import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { AddonsGeneratorSchema } from './schema';

/**
 * Result of cloning a repository
 */
interface CloneResult {
  success: boolean;
  message: string;
  clonePath?: string;
  error?: string;
}

/**
 * Clone a git repository to a specified directory
 */
async function cloneRepository(repositoryUrl: string, targetDir: string): Promise<CloneResult> {
  try {
    // Create target directory if it doesn't exist
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    // Execute git clone command
    execSync(`git clone --depth 1 "${repositoryUrl}" "${targetDir}"`, {
      stdio: 'pipe',
      encoding: 'utf8',
    });

    return {
      success: true,
      message: 'Repository cloned successfully',
      clonePath: targetDir,
    };
  } catch (error: any) {
    console.error('❌ Git clone failed:', error.message);

    // Check for common errors
    if (error.message.includes('not found')) {
      return {
        success: false,
        message: 'Repository not found',
        error: 'The repository URL may be incorrect or you may not have access',
      };
    } else if (error.message.includes('Authentication')) {
      return {
        success: false,
        message: 'Authentication failed',
        error: 'Please check your git credentials',
      };
    } else if (error.message.includes('network')) {
      return {
        success: false,
        message: 'Network error',
        error: 'Please check your internet connection',
      };
    }

    return {
      success: false,
      message: 'Git clone failed',
      error: error.message,
    };
  }
}

/**
 * Result of the setup operation
 */
export interface AwsSetupResult {
  success: boolean;
  message: string;
  clonedPath?: string;
  serverPath?: string;
  error?: string;
}

/**
 * Setup AWS Log Analyzer MCP by cloning the repository
 * This is different from spec-workflow setup because the entire repo needs to persist
 * (not just config files) since the MCP server runs from the cloned location.
 */
export async function setupAwsLogAnalyzer(
  options: AddonsGeneratorSchema & { dryRun?: boolean }
): Promise<AwsSetupResult> {
  // Determine installation location
  const targetPath = join(homedir(), '.aws-log-analyzer-mcp');
  const serverPath = join(targetPath, 'src', 'cw-mcp-server');

  console.log(`\n📁 Setting up AWS Log Analyzer MCP in: ${targetPath}`);

  // Check if already exists
  const isUpdate = existsSync(targetPath);

  if (options.dryRun) {
    console.log('[DRY-RUN] Would clone repository to: ' + targetPath);
    console.log('[DRY-RUN] MCP server would run from: ' + serverPath);
    console.log('[DRY-RUN] Would run: uv sync to install Python dependencies');
    return {
      success: true,
      message: '[DRY-RUN] AWS Log Analyzer setup simulated successfully',
      clonedPath: targetPath,
      serverPath: serverPath,
    };
  }

  if (isUpdate) {
    if (!options.force) {
      const { confirm } = await require('enquirer').prompt({
        type: 'confirm',
        name: 'confirm',
        message: `AWS Log Analyzer repository already exists at ${targetPath}. Update to latest version?`,
        initial: true,
      });

      if (!confirm) {
        console.log('✅ Using existing installation at:', targetPath);
        return {
          success: true,
          message: 'Using existing AWS Log Analyzer installation',
          clonedPath: targetPath,
          serverPath: serverPath,
        };
      }
    }

    console.log('🔄 Updating AWS Log Analyzer repository...');
    // Remove existing directory and re-clone
    rmSync(targetPath, { recursive: true, force: true });
  }

  // Create target directory
  console.log('📁 Creating installation directory...');
  mkdirSync(targetPath, { recursive: true });

  // Clone the repository
  console.log('🔄 Cloning AWS Log Analyzer repository...');
  const cloneResult = await cloneRepository(
    'https://github.com/awslabs/Log-Analyzer-with-MCP.git',
    targetPath
  );

  if (!cloneResult.success) {
    return {
      success: false,
      message: 'Failed to clone AWS Log Analyzer repository',
      error: cloneResult.error || cloneResult.message,
    };
  }

  // Install Python dependencies using uv
  console.log('📦 Installing Python dependencies with uv...');
  try {
    execSync('uv sync', {
      cwd: targetPath,
      stdio: 'inherit',
      encoding: 'utf8',
    });
    console.log('✅ Python dependencies installed successfully');
  } catch (error: any) {
    console.warn('⚠️  Warning: Failed to install Python dependencies');
    console.warn('   You may need to run "uv sync" manually in:', targetPath);
    console.warn('   Error:', error.message);
    // Don't fail the entire setup if dependency installation fails
    // The user can install them manually later
  }

  return {
    success: true,
    message: isUpdate
      ? 'AWS Log Analyzer has been updated to the latest version'
      : 'AWS Log Analyzer has been installed successfully',
    clonedPath: targetPath,
    serverPath: serverPath,
  };
}

/**
 * Get the installation path for AWS Log Analyzer
 * Returns the path where it should be or is installed
 */
export function getAwsLogAnalyzerPath(): string {
  return join(homedir(), '.aws-log-analyzer-mcp');
}

/**
 * Get the server path for AWS Log Analyzer
 */
export function getAwsLogAnalyzerServerPath(): string {
  return join(getAwsLogAnalyzerPath(), 'src', 'cw-mcp-server');
}

/**
 * Check if AWS Log Analyzer is already cloned
 */
export function isAwsLogAnalyzerInstalled(): boolean {
  const serverPath = getAwsLogAnalyzerServerPath();
  return existsSync(serverPath) && existsSync(join(serverPath, 'server.py'));
}
