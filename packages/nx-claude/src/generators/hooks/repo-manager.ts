import { execSync } from 'child_process';
import { logger } from '@nx/devkit';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Internal repository URL for notification hooks
 * @internal
 */
const DEFAULT_REPO_URL =
  'https://github.com/pascalporedda/awesome-claude-code.git';

/**
 * Interface for repository status
 */
export interface RepoStatus {
  exists: boolean;
  path: string;
  isGitRepo: boolean;
  currentBranch?: string;
  lastCommit?: string;
  isDirty?: boolean;
  remoteUrl?: string;
}

/**
 * Get the temporary directory path for cloning the repository
 * @param customPath Optional custom path
 * @returns Path to the repository directory
 */
export function getRepoPath(customPath?: string): string {
  if (customPath) {
    return customPath;
  }
  return path.join(os.tmpdir(), 'claude-hooks-temp');
}

/**
 * Check if a directory is a git repository
 * @param repoPath Path to check
 * @returns true if it's a git repository
 */
function isGitRepository(repoPath: string): boolean {
  try {
    if (!fs.existsSync(repoPath)) {
      return false;
    }
    execSync('git rev-parse --git-dir', {
      cwd: repoPath,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current branch of a git repository
 * @param repoPath Path to the repository
 * @returns Current branch name or undefined
 */
function getCurrentBranch(repoPath: string): string | undefined {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repoPath,
      encoding: 'utf-8',
    }).trim();
    return branch;
  } catch {
    return undefined;
  }
}

/**
 * Get the last commit hash
 * @param repoPath Path to the repository
 * @returns Last commit hash or undefined
 */
function getLastCommit(repoPath: string): string | undefined {
  try {
    const commit = execSync('git rev-parse HEAD', {
      cwd: repoPath,
      encoding: 'utf-8',
    }).trim();
    return commit.substring(0, 7); // Short hash
  } catch {
    return undefined;
  }
}

/**
 * Check if the repository has uncommitted changes
 * @param repoPath Path to the repository
 * @returns true if there are uncommitted changes
 */
function isDirty(repoPath: string): boolean {
  try {
    const status = execSync('git status --porcelain', {
      cwd: repoPath,
      encoding: 'utf-8',
    }).trim();
    return status.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get the remote URL of the repository
 * @param repoPath Path to the repository
 * @returns Remote URL or undefined
 */
function getRemoteUrl(repoPath: string): string | undefined {
  try {
    const url = execSync('git config --get remote.origin.url', {
      cwd: repoPath,
      encoding: 'utf-8',
    }).trim();
    return url;
  } catch {
    return undefined;
  }
}

/**
 * Get the status of the repository
 * @param repoPath Path to check
 * @returns Repository status information
 */
export function getRepoStatus(repoPath: string): RepoStatus {
  const exists = fs.existsSync(repoPath);
  const isGit = exists && isGitRepository(repoPath);

  const status: RepoStatus = {
    exists,
    path: repoPath,
    isGitRepo: isGit,
  };

  if (isGit) {
    status.currentBranch = getCurrentBranch(repoPath);
    status.lastCommit = getLastCommit(repoPath);
    status.isDirty = isDirty(repoPath);
    status.remoteUrl = getRemoteUrl(repoPath);
  }

  return status;
}

/**
 * Clone the notification hooks repository
 * @param repoUrl Repository URL to clone
 * @param targetPath Target directory path
 * @param verbose Show detailed output
 * @returns true if successful
 */
export async function cloneRepository(
  repoUrl: string = DEFAULT_REPO_URL,
  targetPath?: string,
  verbose = false
): Promise<boolean> {
  const repoPath = getRepoPath(targetPath);

  try {
    // Check if directory already exists
    if (fs.existsSync(repoPath)) {
      logger.warn(`Directory already exists: ${repoPath}`);

      // Check if it's a git repository
      if (isGitRepository(repoPath)) {
        logger.info('Existing git repository found');
        return true;
      } else {
        // Remove non-git directory
        logger.info('Removing non-git directory...');
        fs.rmSync(repoPath, { recursive: true, force: true });
      }
    }

    logger.info(`📥 Downloading notification hooks...`);

    // Try HTTPS first
    try {
      execSync(`git clone ${repoUrl} "${repoPath}"`, {
        stdio: verbose ? 'inherit' : 'ignore',
      });
      logger.info('✅ Download complete');
      return true;
    } catch (httpsError) {
      // If HTTPS fails and it's the default repo, try SSH
      if (repoUrl === DEFAULT_REPO_URL) {
        logger.warn('HTTPS clone failed, trying SSH...');
        const sshUrl = 'git@github.com:pascalporedda/awesome-claude-code.git';

        try {
          execSync(`git clone ${sshUrl} "${repoPath}"`, {
            stdio: verbose ? 'inherit' : 'ignore',
          });
          logger.info('✅ Download complete via SSH');
          return true;
        } catch (sshError) {
          logger.error('❌ Both HTTPS and SSH clone attempts failed');
          throw sshError;
        }
      } else {
        throw httpsError;
      }
    }
  } catch (error) {
    logger.error(`❌ Failed to download hooks: ${error}`);
    return false;
  }
}

/**
 * Update the repository to the latest version
 * @param repoPath Path to the repository
 * @param verbose Show detailed output
 * @returns true if successful
 */
export async function updateRepository(
  repoPath: string,
  verbose = false
): Promise<boolean> {
  try {
    // Check if it's a git repository
    if (!isGitRepository(repoPath)) {
      logger.error('Not a git repository');
      return false;
    }

    // Check for uncommitted changes
    if (isDirty(repoPath)) {
      logger.warn('⚠️  Repository has uncommitted changes');
      logger.info('Stashing changes...');
      execSync('git stash', {
        cwd: repoPath,
        stdio: verbose ? 'inherit' : 'ignore',
      });
    }

    logger.info('📥 Updating to latest version...');

    // Fetch latest changes
    execSync('git fetch origin', {
      cwd: repoPath,
      stdio: verbose ? 'inherit' : 'ignore',
    });

    // Pull latest changes
    execSync('git pull origin main', {
      cwd: repoPath,
      stdio: verbose ? 'inherit' : 'ignore',
    });

    logger.info('✅ Update complete');
    return true;
  } catch (error) {
    logger.error(`❌ Failed to update: ${error}`);
    return false;
  }
}

/**
 * Get the latest version/tag of the repository
 * @param repoPath Path to the repository
 * @returns Latest version string or undefined
 */
export function getLatestVersion(repoPath: string): string | undefined {
  try {
    // Try to get the latest tag
    const latestTag = execSync('git describe --tags --abbrev=0', {
      cwd: repoPath,
      encoding: 'utf-8',
    }).trim();

    if (latestTag) {
      return latestTag;
    }
  } catch {
    // If no tags, return the commit hash
    return getLastCommit(repoPath);
  }

  return undefined;
}

/**
 * Clean up the repository directory
 * @param repoPath Path to the repository
 * @returns true if successful
 */
export function cleanupRepository(repoPath: string): boolean {
  try {
    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
      logger.info('🧹 Temporary files cleaned up');
      return true;
    }
    return true;
  } catch (error) {
    logger.error(`❌ Failed to cleanup: ${error}`);
    return false;
  }
}

/**
 * Ensure the repository is available and up-to-date
 * @param options Configuration options
 * @returns Repository path if successful, null otherwise
 */
export async function ensureRepository(options: {
  repoUrl?: string;
  targetPath?: string;
  update?: boolean;
  verbose?: boolean;
}): Promise<string | null> {
  const repoUrl = options.repoUrl || DEFAULT_REPO_URL;
  const repoPath = getRepoPath(options.targetPath);
  const status = getRepoStatus(repoPath);

  // Log current status
  if (options.verbose) {
    logger.info('Repository status:');
    logger.info(`  Path: ${status.path}`);
    logger.info(`  Exists: ${status.exists}`);
    logger.info(`  Is Git Repo: ${status.isGitRepo}`);
    if (status.isGitRepo) {
      logger.info(`  Branch: ${status.currentBranch}`);
      logger.info(`  Last Commit: ${status.lastCommit}`);
      logger.info(`  Has Changes: ${status.isDirty}`);
      logger.info(`  Remote URL: ${status.remoteUrl}`);
    }
  }

  // If repository exists and is valid
  if (status.exists && status.isGitRepo) {
    // Check if it's the right repository
    if (status.remoteUrl && !status.remoteUrl.includes('awesome-claude-code')) {
      // Different repo found, remove it and re-clone
      cleanupRepository(repoPath);
      const cloned = await cloneRepository(
        DEFAULT_REPO_URL,
        options.targetPath,
        options.verbose
      );
      if (!cloned) {
        return null;
      }
      return repoPath;
    }

    // Always update to get latest version
    const updated = await updateRepository(repoPath, options.verbose);
    if (!updated) {
      logger.warn('⚠️  Failed to update, using existing version');
    }

    return repoPath;
  }

  // Clone the repository
  const cloned = await cloneRepository(
    repoUrl,
    options.targetPath,
    options.verbose
  );
  if (!cloned) {
    return null;
  }

  return repoPath;
}
