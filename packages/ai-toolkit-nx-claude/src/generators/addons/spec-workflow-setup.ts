import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { cpSync } from 'fs';
import type { AddonsGeneratorSchema } from './schema';

/**
 * Result of the setup operation
 */
export interface SetupResult {
  success: boolean;
  message: string;
  projectPath: string;
  createdFiles?: string[];
}

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
 * Result of copying configuration files
 */
interface CopyResult {
  success: boolean;
  message: string;
  copiedFiles?: string[];
  error?: string;
}

/**
 * Setup spec-workflow in an existing project
 */
export async function setupSpecWorkflow(
  projectPath: string,
  options: AddonsGeneratorSchema & { dryRun?: boolean }
): Promise<SetupResult> {
  const targetPath = projectPath || process.cwd();
  const targetDir = join(targetPath, '.spec-workflow');

  console.log(`\n📁 Setting up spec-workflow in: ${targetPath}`);

  // Track if this is an update or new installation
  const isUpdate = existsSync(targetDir);

  if (options.dryRun) {
    console.log('[DRY-RUN] Would create/update directory: ' + targetDir);
    console.log('[DRY-RUN] Would clone repository: @uniswap/spec-workflow-mcp');
    console.log('[DRY-RUN] Would copy/update configuration files');
    console.log('[DRY-RUN] Would add .spec-workflow/ to .gitignore');
    return {
      success: true,
      message: '[DRY-RUN] Spec-workflow setup simulated successfully',
      projectPath: targetPath,
    };
  }

  // Check if directory already exists
  if (isUpdate) {
    if (!options.force) {
      const { confirm } = await require('enquirer').prompt({
        type: 'confirm',
        name: 'confirm',
        message: `.spec-workflow directory already exists. Update configuration files from repository?`,
        initial: true,
      });

      if (!confirm) {
        return {
          success: false,
          message: 'Installation cancelled by user',
          projectPath: targetPath,
        };
      }
    }

    console.log(
      '📝 Updating configuration files in existing .spec-workflow directory...'
    );
  } else {
    // Create .spec-workflow directory if it doesn't exist
    console.log('📁 Creating .spec-workflow directory...');
    mkdirSync(targetDir, { recursive: true });
  }

  // Clone the repository to a temporary directory
  const tempDir = join(tmpdir(), `spec-workflow-${Date.now()}`);
  console.log('🔄 Cloning spec-workflow repository...');

  const cloneResult = await cloneRepository(
    'https://github.com/Uniswap/spec-workflow-mcp.git',
    tempDir
  );

  if (!cloneResult.success) {
    // Don't remove the directory on failure - it may contain user files
    return {
      success: false,
      message: cloneResult.error || 'Failed to clone repository',
      projectPath: targetPath,
    };
  }

  // Copy configuration files
  console.log('📋 Copying configuration files...');
  const configSourcePath = join(tempDir, 'configs');

  const copyResult = await copyConfigFiles(configSourcePath, targetDir);

  // Clean up temporary clone
  console.log('🧹 Cleaning up temporary files...');
  rmSync(tempDir, { recursive: true, force: true });

  if (!copyResult.success) {
    // Don't remove the directory on failure - it may contain user files
    return {
      success: false,
      message: copyResult.error || 'Failed to copy configuration files',
      projectPath: targetPath,
    };
  }

  // Update .gitignore to include .spec-workflow/
  console.log('📝 Updating .gitignore...');
  const gitignoreResult = await updateGitignore(targetPath, '.spec-workflow/');

  if (!gitignoreResult.success) {
    console.warn('⚠️  Warning:', gitignoreResult.message);
    // Don't fail the entire setup if .gitignore update fails
  } else {
    console.log('✅', gitignoreResult.message);
  }

  return {
    success: true,
    message: isUpdate
      ? 'The spec-workflow configuration has been updated with the latest templates and settings'
      : 'The spec-workflow package has been added to the project with automatic agent orchestration enabled',
    projectPath: targetPath,
    createdFiles: copyResult.copiedFiles,
  };
}

/**
 * Clone a git repository to a specified directory
 */
export async function cloneRepository(
  repositoryUrl: string,
  targetDir: string
): Promise<CloneResult> {
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
 * Update .gitignore file to include a pattern if not already present
 */
export async function updateGitignore(
  projectPath: string,
  pattern: string
): Promise<{ success: boolean; message: string }> {
  const gitignorePath = join(projectPath, '.gitignore');

  try {
    let gitignoreContent = '';

    // Read existing .gitignore if it exists
    if (existsSync(gitignorePath)) {
      gitignoreContent = readFileSync(gitignorePath, 'utf8');
    }

    // Check if pattern already exists
    const lines = gitignoreContent.split('\n');
    const patternExists = lines.some((line) => {
      const trimmedLine = line.trim();
      return (
        trimmedLine === pattern || trimmedLine === pattern.replace(/\/$/, '')
      );
    });

    if (patternExists) {
      return {
        success: true,
        message: `.gitignore already contains ${pattern}`,
      };
    }

    // Add pattern to .gitignore
    const updatedContent =
      gitignoreContent.trim() === ''
        ? pattern
        : `${gitignoreContent.trim()}\n\n# Spec workflow configuration\n${pattern}`;

    writeFileSync(gitignorePath, updatedContent + '\n', 'utf8');

    return {
      success: true,
      message: `Added ${pattern} to .gitignore`,
    };
  } catch (error: any) {
    console.error('❌ Failed to update .gitignore:', error.message);
    return {
      success: false,
      message: `Failed to update .gitignore: ${error.message}`,
    };
  }
}

/**
 * Copy configuration files from source to target directory
 * This will overwrite existing files but preserve any additional files in the target
 */
export async function copyConfigFiles(
  sourceDir: string,
  targetDir: string
): Promise<CopyResult> {
  try {
    // Check if source directory exists
    if (!existsSync(sourceDir)) {
      return {
        success: false,
        message: 'Source directory not found',
        error: `The configs directory was not found in the cloned repository`,
      };
    }

    // Copy all files from config directory (this will overwrite existing files)
    cpSync(sourceDir, targetDir, { recursive: true });

    // List copied files for confirmation
    const fs = require('fs');
    const copiedFiles: string[] = [];

    function listFiles(
      dir: string,
      baseDir: string = dir,
      sourceBase: string = sourceDir
    ) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          listFiles(filePath, baseDir, sourceBase);
        } else {
          // Only list files that were actually copied from the source
          const relativePath = filePath.replace(baseDir + '/', '');
          const sourceFile = join(sourceBase, relativePath);
          if (existsSync(sourceFile)) {
            copiedFiles.push(relativePath);
          }
        }
      }
    }

    listFiles(targetDir, targetDir, sourceDir);

    return {
      success: true,
      message: 'Configuration files copied successfully',
      copiedFiles,
    };
  } catch (error: any) {
    console.error('❌ File copy failed:', error.message);

    return {
      success: false,
      message: 'Failed to copy configuration files',
      error: error.message,
    };
  }
}
