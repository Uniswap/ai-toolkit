import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { AddonsGeneratorSchema } from './schema';

/**
 * Result of the setup operation
 */
export interface DockerSetupResult {
  success: boolean;
  message: string;
  projectPath: string;
  createdFiles?: string[];
  error?: string;
}

/**
 * Get the path to the bundled devcontainer files
 * These are bundled with the package when published
 */
function getBundledDevcontainerPath(): string {
  // When running from the built package, the files are in content/devcontainer
  const bundledPath = join(__dirname, '..', '..', 'content', 'devcontainer');
  if (existsSync(bundledPath)) {
    return bundledPath;
  }

  // When running from source (development), check the workspace root
  const workspacePath = join(
    process.cwd(),
    'packages',
    'ai-toolkit-nx-claude',
    'src',
    'content',
    'devcontainer'
  );
  if (existsSync(workspacePath)) {
    return workspacePath;
  }

  // Fallback to monorepo root .devcontainer (for ai-toolkit itself)
  const monorepoPath = join(process.cwd(), '.devcontainer');
  if (existsSync(monorepoPath)) {
    return monorepoPath;
  }

  throw new Error(
    'Could not find bundled devcontainer files. Please ensure the package is properly installed.'
  );
}

/**
 * Setup Docker sandbox (devcontainer) in an existing project
 *
 * This function copies the devcontainer configuration files to enable
 * running Claude Code with --dangerously-skip-permissions in a secure
 * sandboxed Docker environment.
 */
export async function setupDockerSandbox(
  projectPath: string,
  options: AddonsGeneratorSchema & { dryRun?: boolean }
): Promise<DockerSetupResult> {
  const targetPath = projectPath || process.cwd();
  const targetDir = join(targetPath, '.devcontainer');

  console.log(`\n📁 Setting up Docker sandbox in: ${targetPath}`);

  // Track if this is an update or new installation
  const isUpdate = existsSync(targetDir);

  if (options.dryRun) {
    console.log('[DRY-RUN] Would create/update directory: ' + targetDir);
    console.log('[DRY-RUN] Would copy devcontainer configuration files:');
    console.log('[DRY-RUN]   - devcontainer.json');
    console.log('[DRY-RUN]   - Dockerfile');
    console.log('[DRY-RUN]   - init-firewall.sh');
    console.log('[DRY-RUN]   - README.md');
    return {
      success: true,
      message: '[DRY-RUN] Docker sandbox setup simulated successfully',
      projectPath: targetPath,
      createdFiles: [
        'devcontainer.json',
        'Dockerfile',
        'init-firewall.sh',
        'README.md',
      ],
    };
  }

  // Check if directory already exists
  if (isUpdate) {
    if (!options.force) {
      const { confirm } = await require('enquirer').prompt({
        type: 'confirm',
        name: 'confirm',
        message: `.devcontainer directory already exists. Update configuration files?`,
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
      '📝 Updating configuration files in existing .devcontainer directory...'
    );
  } else {
    // Create .devcontainer directory if it doesn't exist
    console.log('📁 Creating .devcontainer directory...');
    mkdirSync(targetDir, { recursive: true });
  }

  // Get the source devcontainer files
  let sourcePath: string;
  try {
    sourcePath = getBundledDevcontainerPath();
    console.log(`📋 Copying devcontainer files from: ${sourcePath}`);
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      projectPath: targetPath,
      error: error.message,
    };
  }

  // Copy configuration files
  const filesToCopy = [
    'devcontainer.json',
    'Dockerfile',
    'init-firewall.sh',
    'README.md',
  ];
  const copiedFiles: string[] = [];

  for (const file of filesToCopy) {
    const sourceFile = join(sourcePath, file);
    const targetFile = join(targetDir, file);

    if (existsSync(sourceFile)) {
      try {
        const content = readFileSync(sourceFile, 'utf8');
        writeFileSync(targetFile, content, { mode: file === 'init-firewall.sh' ? 0o755 : 0o644 });
        copiedFiles.push(file);
        console.log(`   ✅ Copied: ${file}`);
      } catch (error: any) {
        console.error(`   ❌ Failed to copy ${file}: ${error.message}`);
        return {
          success: false,
          message: `Failed to copy ${file}`,
          projectPath: targetPath,
          error: error.message,
        };
      }
    } else {
      console.warn(`   ⚠️  Source file not found: ${file}`);
    }
  }

  if (copiedFiles.length === 0) {
    return {
      success: false,
      message: 'No files were copied',
      projectPath: targetPath,
      error: 'Source devcontainer files not found',
    };
  }

  console.log('\n✅ Docker sandbox setup complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Open this project in VS Code');
  console.log('   2. Click "Reopen in Container" when prompted');
  console.log('   3. Run Claude Code with: claude --dangerously-skip-permissions');
  console.log('\n📚 See .devcontainer/README.md for more details');

  return {
    success: true,
    message: isUpdate
      ? 'Docker sandbox configuration has been updated'
      : 'Docker sandbox has been set up for secure Claude Code execution',
    projectPath: targetPath,
    createdFiles: copiedFiles,
  };
}

/**
 * Check if Docker is installed and available
 */
export async function checkDockerAvailable(): Promise<{
  available: boolean;
  message: string;
}> {
  try {
    const { execSync } = require('child_process');
    execSync('docker --version', { stdio: 'pipe' });
    return {
      available: true,
      message: 'Docker is available',
    };
  } catch {
    return {
      available: false,
      message: 'Docker is not installed or not running',
    };
  }
}

/**
 * Check if VS Code Dev Containers extension is recommended
 */
export function getDevContainerExtensionInfo(): string {
  return `
To use this devcontainer, you need:
  1. Docker Desktop (or Docker Engine on Linux)
  2. VS Code with the "Dev Containers" extension
     - Extension ID: ms-vscode-remote.remote-containers
     - Or use Cursor/other compatible IDE

Install the extension:
  code --install-extension ms-vscode-remote.remote-containers
`;
}
