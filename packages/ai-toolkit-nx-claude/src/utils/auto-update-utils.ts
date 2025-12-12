import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { logger } from '@nx/devkit';

export type ShellType = 'bash' | 'zsh' | 'fish';

export interface ShellConfig {
  shell: ShellType;
  rcFile: string;
}

/**
 * Gets the current version of the toolkit from package.json
 */
export function getCurrentToolkitVersion(): string {
  try {
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    logger.info('checking parent directory for package.json');
    // TODO(melvillian): this can happen when we're running via npx and the
    // package.json is located in the parent directory. Go back and make this
    // more robust after we do the demo
    const packageJsonPath = path.join(__dirname, '..', '..', '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  }
}

/**
 * Detects the current shell type from environment
 */
export function detectShell(): ShellType {
  const shell = process.env.SHELL || '';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('fish')) return 'fish';
  return 'bash'; // default
}

/**
 * Gets the shell config file path for a given shell type
 */
export function getShellConfigPath(shell: ShellType): string {
  const homeDir = os.homedir();
  const configs: Record<ShellType, string> = {
    bash: path.join(homeDir, '.bashrc'),
    zsh: path.join(homeDir, '.zshrc'),
    fish: path.join(homeDir, '.config/fish/config.fish'),
  };
  return configs[shell];
}

/**
 * Generates the auto-update bash/zsh snippet
 */
export function generateAutoUpdateSnippet(version: string): string {
  return `# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK v${version}
_ai_toolkit_check_updates() {
  [ -n "$AI_TOOLKIT_SKIP_UPDATE_CHECK" ] && return

  local cache="\${HOME}/.uniswap-ai-toolkit/.last-update-check"
  local cache_dir="\${HOME}/.uniswap-ai-toolkit"

  # Create cache directory if it doesn't exist
  [ ! -d "$cache_dir" ] && mkdir -p "$cache_dir"

  # Check once per week
  if [ -f "$cache" ]; then
    local last_check=$(cat "$cache" 2>/dev/null || echo 0)
    local now=$(date +%s)
    [ $((now - last_check)) -lt 604800 ] && return
  fi

  echo "⏳ Checking for AI Toolkit updates..."
  echo "   Disable these checks with: export AI_TOOLKIT_SKIP_UPDATE_CHECK=1\n"

  # Extract version from this script's comment
  local current=$(grep --max-count=1 "# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK" "\${BASH_SOURCE[0]:-$HOME/.zshrc}" 2>/dev/null | sed 's/.*v\\([0-9][^ ]*\\).*/\\1/')

  # Get latest version from npm registry and display a message if an update is available
  if command -v npm >/dev/null 2>&1; then
    if ! npm view @uniswap/ai-toolkit-nx-claude@latest version >/dev/null 2>&1; then
      echo "⚠️  Failed to check for AI Toolkit updates (npm registry unavailable)"
      echo "🐞 Please report this bug at https://github.com/Uniswap/ai-toolkit/issues"
      return
    fi
    
    local latest=$(npm view @uniswap/ai-toolkit-nx-claude@latest version 2>/dev/null)

    if [ -n "$latest" ] && [ -n "$current" ] && [ "$current" != "$latest" ]; then
      echo "📦 AI Toolkit update available: $current → $latest"
      echo "   Run: npx @uniswap/ai-toolkit-nx-claude@latest"
      echo "   Disable these checks: export AI_TOOLKIT_SKIP_UPDATE_CHECK=1"
    fi
  fi

  date +%s > "$cache" 2>/dev/null
}

_ai_toolkit_check_updates
# END AI_TOOLKIT_UPDATE_CHECK`;
}

/**
 * Generates the auto-update fish snippet
 */
export function generateFishAutoUpdateSnippet(version: string): string {
  return `# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK v${version}
function _ai_toolkit_check_updates
  if set -q AI_TOOLKIT_SKIP_UPDATE_CHECK
    return
  end

  set -l cache "$HOME/.uniswap-ai-toolkit/.last-update-check"
  set -l cache_dir "$HOME/.uniswap-ai-toolkit"

  # Create cache directory if it doesn't exist
  if not test -d "$cache_dir"
    mkdir -p "$cache_dir"
  end

  # Check once per week
  if test -f "$cache"
    set -l last_check (cat "$cache" 2>/dev/null; or echo 0)
    set -l now (date +%s)
    if test (math "$now - $last_check") -lt 604800
      return
    end
  end
  
  echo "⏳ Checking for AI Toolkit updates..."
  echo "   Disable these checks with: export AI_TOOLKIT_SKIP_UPDATE_CHECK=1\n"

  # Check the latest version of the toolkit in npmjs registry and
  # display a message if an update is available
  set -l current (grep --max-count=1 "# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK" ~/.config/fish/config.fish 2>/dev/null | sed "s/.*v\\([0-9][^ ]*\\).*/\\1/")

  if command -v npm >/dev/null 2>&1
    if not npm view @uniswap/ai-toolkit-nx-claude@latest version >/dev/null 2>&1
      echo "⚠️  Failed to check for AI Toolkit updates (npm registry unavailable)"
      echo "🐞 Please report this bug at https://github.com/Uniswap/ai-toolkit/issues"
      return
    end
    
    set -l latest (npm view @uniswap/ai-toolkit-nx-claude@latest version 2>/dev/null)

    if test -n "$latest" -a -n "$current" -a "$current" != "$latest"
      echo "📦 AI Toolkit update available: $current → $latest"
      echo "   Run: npx @uniswap/ai-toolkit-nx-claude@latest"
      echo "   Disable these checks: set -x AI_TOOLKIT_SKIP_UPDATE_CHECK 1"
    end
  end

  date +%s > "$cache" 2>/dev/null
end

_ai_toolkit_check_updates
# END AI_TOOLKIT_UPDATE_CHECK`;
}

/**
 * Installs the auto-update checker into the shell config
 */
export function installUpdateChecker(shell: ShellType, version: string): void {
  const configPath = getShellConfigPath(shell);

  // 1. Backup existing config if it exists
  if (fs.existsSync(configPath)) {
    const backupPath = `${configPath}.backup-${Date.now()}`;
    fs.copyFileSync(configPath, backupPath);
    logger.info(`📋 Backed up ${configPath} to ${backupPath}`);
  } else {
    // Create the config file if it doesn't exist
    fs.writeFileSync(configPath, '');
    logger.info(`📝 Created ${configPath}`);
  }

  // 2. Remove existing auto-update block if present
  let configContent = fs.readFileSync(configPath, 'utf-8');

  // Use regex to remove the block between markers
  const startMarker = '# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK';
  const endMarker = '# END AI_TOOLKIT_UPDATE_CHECK';
  const blockRegex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}\\n?`, 'g');
  configContent = configContent.replace(blockRegex, '');

  // 3. Append new auto-update block
  const snippet =
    shell === 'fish' ? generateFishAutoUpdateSnippet(version) : generateAutoUpdateSnippet(version);

  // Ensure there's a newline before our snippet if file has content
  const prefix = configContent.trim() ? '\n\n' : '';
  const updatedContent = configContent + prefix + snippet + '\n';

  fs.writeFileSync(configPath, updatedContent);

  logger.info(`✅ Update checker installed to ${configPath}`);
  logger.info(`   Checks once per week, disable with: export AI_TOOLKIT_SKIP_UPDATE_CHECK=1`);
}
