import { execSync } from 'child_process';
import { logger } from '@nx/devkit';

/**
 * Interface for dependency status information
 */
export interface DependencyStatus {
  hasNode: boolean;
  nodeVersion?: string;
  hasNpm: boolean;
  npmVersion?: string;
  hasGit: boolean;
  gitVersion?: string;
  missingDependencies: string[];
}

/**
 * Check if a command exists in the system PATH
 * @param command The command to check
 * @returns true if the command exists, false otherwise
 */
function commandExists(command: string): boolean {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the version of a command
 * @param command The command to get version for
 * @param versionFlag The flag to use for version (default: --version)
 * @returns The version string or undefined if unable to get version
 */
function getCommandVersion(
  command: string,
  versionFlag = '--version'
): string | undefined {
  try {
    const output = execSync(`${command} ${versionFlag}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();

    // Extract version number from output
    const versionMatch = output.match(/(\d+\.\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : output.split('\n')[0];
  } catch {
    return undefined;
  }
}

/**
 * Check all required dependencies for the hooks generator
 * @returns Structured dependency status
 */
export function checkDependencies(): DependencyStatus {
  const status: DependencyStatus = {
    hasNode: false,
    hasNpm: false,
    hasGit: false,
    missingDependencies: [],
  };

  // Check Node.js
  if (commandExists('node')) {
    status.hasNode = true;
    status.nodeVersion = getCommandVersion('node');
  } else {
    status.missingDependencies.push('Node.js');
  }

  // Check npm
  if (commandExists('npm')) {
    status.hasNpm = true;
    status.npmVersion = getCommandVersion('npm');
  } else {
    status.missingDependencies.push('npm');
  }

  // Check Git
  if (commandExists('git')) {
    status.hasGit = true;
    status.gitVersion = getCommandVersion('git');
  } else {
    status.missingDependencies.push('Git');
  }

  return status;
}

/**
 * Log dependency status to the console
 * @param status The dependency status to log
 */
export function logDependencyStatus(status: DependencyStatus): void {
  logger.info('📋 Dependency Check Results:');

  if (status.hasNode) {
    logger.info(`  ✅ Node.js: ${status.nodeVersion || 'installed'}`);
  } else {
    logger.error('  ❌ Node.js: not found');
  }

  if (status.hasNpm) {
    logger.info(`  ✅ npm: ${status.npmVersion || 'installed'}`);
  } else {
    logger.error('  ❌ npm: not found');
  }

  if (status.hasGit) {
    logger.info(`  ✅ Git: ${status.gitVersion || 'installed'}`);
  } else {
    logger.error('  ❌ Git: not found');
  }
}

/**
 * Check if all required dependencies are installed
 * @param status The dependency status to check
 * @returns true if all dependencies are installed, false otherwise
 */
export function hasAllDependencies(status: DependencyStatus): boolean {
  return status.missingDependencies.length === 0;
}

/**
 * Get installation instructions for missing dependencies
 * @param missingDeps Array of missing dependency names
 * @returns Installation instructions string
 */
export function getInstallInstructions(missingDeps: string[]): string {
  const instructions: string[] = [];

  if (missingDeps.includes('Node.js') || missingDeps.includes('npm')) {
    instructions.push(
      '📦 Node.js and npm:',
      '  • macOS: brew install node',
      '  • Linux: sudo apt-get install nodejs npm',
      '  • Windows: Download from https://nodejs.org/',
      ''
    );
  }

  if (missingDeps.includes('Git')) {
    instructions.push(
      '📦 Git:',
      '  • macOS: brew install git',
      '  • Linux: sudo apt-get install git',
      '  • Windows: Download from https://git-scm.com/',
      ''
    );
  }

  return instructions.join('\n');
}

/**
 * Validate that required dependencies meet minimum version requirements
 * @param status The dependency status to validate
 * @returns true if all version requirements are met, false otherwise
 */
export function validateVersions(status: DependencyStatus): boolean {
  // Minimum version requirements
  const MIN_NODE_VERSION = '16.0.0';
  const MIN_NPM_VERSION = '7.0.0';
  const MIN_GIT_VERSION = '2.0.0';

  // Helper function to compare versions
  const compareVersions = (
    current: string | undefined,
    minimum: string
  ): boolean => {
    if (!current) return false;

    const currentParts = current.split('.').map(Number);
    const minimumParts = minimum.split('.').map(Number);

    for (let i = 0; i < minimumParts.length; i++) {
      if (currentParts[i] > minimumParts[i]) return true;
      if (currentParts[i] < minimumParts[i]) return false;
    }
    return true;
  };

  // Check Node.js version
  if (
    status.hasNode &&
    !compareVersions(status.nodeVersion, MIN_NODE_VERSION)
  ) {
    logger.warn(
      `⚠️  Node.js version ${status.nodeVersion} is below minimum required version ${MIN_NODE_VERSION}`
    );
    return false;
  }

  // Check npm version
  if (status.hasNpm && !compareVersions(status.npmVersion, MIN_NPM_VERSION)) {
    logger.warn(
      `⚠️  npm version ${status.npmVersion} is below minimum required version ${MIN_NPM_VERSION}`
    );
    return false;
  }

  // Check Git version
  if (status.hasGit && !compareVersions(status.gitVersion, MIN_GIT_VERSION)) {
    logger.warn(
      `⚠️  Git version ${status.gitVersion} is below minimum required version ${MIN_GIT_VERSION}`
    );
    return false;
  }

  return true;
}

/**
 * Main function to check and validate all dependencies
 * @returns true if all dependencies are satisfied, false otherwise
 */
export async function checkAndValidateDependencies(): Promise<boolean> {
  const status = checkDependencies();

  // Log the dependency status
  logDependencyStatus(status);

  // Check if any dependencies are missing
  if (!hasAllDependencies(status)) {
    logger.error('\n❌ Missing required dependencies:');
    logger.info(getInstallInstructions(status.missingDependencies));
    return false;
  }

  // Validate versions
  if (!validateVersions(status)) {
    logger.error(
      '\n❌ Some dependencies do not meet minimum version requirements'
    );
    logger.info('Please update the affected tools to continue.');
    return false;
  }

  logger.info('\n✅ All dependencies satisfied!');
  return true;
}
