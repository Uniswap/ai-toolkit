import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type { ClaudeConfig, DeniedMcpServer, SettingsLocal } from './types';
import { getGlobalConfigPath, getLocalConfigPath, isPluginServerName } from './reader';

/**
 * Ensure the .claude directory exists
 */
function ensureClaudeDirectory(): void {
  const configPath = getLocalConfigPath();
  const configDir = dirname(configPath);

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

/**
 * Update global configuration (~/.claude.json) with disabled plugin servers
 * Plugin servers need to be disabled in the global config's project-specific
 * disabledMcpServers array, NOT in the local .claude/settings.local.json
 *
 * @param disabledPluginServers Array of full plugin server names (plugin:pluginName:serverName)
 */
export function updateGlobalConfigPluginServers(disabledPluginServers: string[]): void {
  const configPath = getGlobalConfigPath();
  const cwd = process.cwd();

  let config: ClaudeConfig = {};

  // Read existing config if it exists
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      config = JSON.parse(content) as ClaudeConfig;
    } catch (error) {
      console.error(`Failed to read global config: ${error}`);
      // Don't throw - we can continue with empty config
      config = {};
    }
  }

  // Ensure projects object exists
  if (!config.projects) {
    config.projects = {};
  }

  // Ensure project entry exists for current directory
  if (!config.projects[cwd]) {
    config.projects[cwd] = {};
  }

  // Update disabledMcpServers for the current project
  // Only include plugin servers in this array
  config.projects[cwd].disabledMcpServers = disabledPluginServers;

  // Write updated config
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write global config: ${error}`);
  }
}

/**
 * Update local configuration with denied servers
 *
 * This function handles both regular and plugin-installed MCP servers:
 * - Regular servers (from mcp.json, ~/.claude.json mcpServers) are written to
 *   ./.claude/settings.local.json
 * - Plugin servers (with names like "plugin:pluginName:serverName") are written to
 *   ~/.claude.json projects[cwd].disabledMcpServers
 *
 * @param deniedServers Array of server names that should be denied
 */
export function updateLocalConfig(deniedServers: string[]): void {
  // Separate plugin servers from regular servers
  const pluginServers = deniedServers.filter((s) => isPluginServerName(s));
  const regularServers = deniedServers.filter((s) => !isPluginServerName(s));

  // 1. Update global config for plugin servers
  // This writes to ~/.claude.json projects[cwd].disabledMcpServers
  updateGlobalConfigPluginServers(pluginServers);

  // 2. Update local config for regular servers
  // This writes to ./.claude/settings.local.json deniedMcpServers
  ensureClaudeDirectory();

  const configPath = getLocalConfigPath();
  let config: SettingsLocal = {};

  // Read existing config if it exists
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      config = JSON.parse(content) as SettingsLocal;
    } catch (error) {
      console.error(`Failed to read existing config, creating new one: ${error}`);
      config = {};
    }
  }

  // Update deniedMcpServers array with object format (only regular servers)
  config.deniedMcpServers = regularServers.map((serverName): DeniedMcpServer => ({ serverName }));

  // Write updated config
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write config: ${error}`);
  }
}

/**
 * Enable a plugin server by removing it from global config's disabledMcpServers
 */
function enablePluginServer(serverName: string): void {
  const configPath = getGlobalConfigPath();
  const cwd = process.cwd();

  if (!existsSync(configPath)) {
    // No global config means all servers are enabled, nothing to do
    return;
  }

  let config: ClaudeConfig;
  try {
    const content = readFileSync(configPath, 'utf-8');
    config = JSON.parse(content) as ClaudeConfig;
  } catch (error) {
    throw new Error(`Failed to read global config: ${error}`);
  }

  if (!config.projects?.[cwd]?.disabledMcpServers) {
    // No disabled servers for this project, nothing to do
    return;
  }

  // Remove server from disabled list
  config.projects[cwd].disabledMcpServers = config.projects[cwd].disabledMcpServers.filter(
    (name) => name !== serverName
  );

  // Write updated config
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write global config: ${error}`);
  }
}

/**
 * Disable a plugin server by adding it to global config's disabledMcpServers
 */
function disablePluginServer(serverName: string): void {
  const configPath = getGlobalConfigPath();
  const cwd = process.cwd();

  let config: ClaudeConfig = {};

  // Read existing config if it exists
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      config = JSON.parse(content) as ClaudeConfig;
    } catch (error) {
      console.error(`Failed to read global config: ${error}`);
      config = {};
    }
  }

  // Ensure projects and project entry exist
  if (!config.projects) {
    config.projects = {};
  }
  if (!config.projects[cwd]) {
    config.projects[cwd] = {};
  }

  // Initialize disabledMcpServers if it doesn't exist
  if (!config.projects[cwd].disabledMcpServers) {
    config.projects[cwd].disabledMcpServers = [];
  }

  // Check if server is already disabled
  if (!config.projects[cwd].disabledMcpServers.includes(serverName)) {
    config.projects[cwd].disabledMcpServers.push(serverName);
  }

  // Write updated config
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write global config: ${error}`);
  }
}

/**
 * Enable a server by removing it from the appropriate config
 * - Plugin servers are enabled by removing from ~/.claude.json projects[cwd].disabledMcpServers
 * - Regular servers are enabled by removing from ./.claude/settings.local.json deniedMcpServers
 */
export function enableServer(serverName: string): void {
  // Handle plugin servers separately
  if (isPluginServerName(serverName)) {
    enablePluginServer(serverName);
    return;
  }

  // Handle regular servers
  const configPath = getLocalConfigPath();

  if (!existsSync(configPath)) {
    // No config file means all servers are enabled, nothing to do
    return;
  }

  let config: SettingsLocal;
  try {
    const content = readFileSync(configPath, 'utf-8');
    config = JSON.parse(content) as SettingsLocal;
  } catch (error) {
    throw new Error(`Failed to read config: ${error}`);
  }

  if (!config.deniedMcpServers) {
    // No denied servers, nothing to do
    return;
  }

  // Remove server from denied list
  config.deniedMcpServers = config.deniedMcpServers.filter(
    (denied) => denied.serverName !== serverName
  );

  // Write updated config
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write config: ${error}`);
  }
}

/**
 * Disable a server by adding it to the appropriate config
 * - Plugin servers are disabled by adding to ~/.claude.json projects[cwd].disabledMcpServers
 * - Regular servers are disabled by adding to ./.claude/settings.local.json deniedMcpServers
 */
export function disableServer(serverName: string): void {
  // Handle plugin servers separately
  if (isPluginServerName(serverName)) {
    disablePluginServer(serverName);
    return;
  }

  // Handle regular servers
  ensureClaudeDirectory();

  const configPath = getLocalConfigPath();
  let config: SettingsLocal = {};

  // Read existing config if it exists
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      config = JSON.parse(content) as SettingsLocal;
    } catch (error) {
      console.error(`Failed to read existing config, creating new one: ${error}`);
      config = {};
    }
  }

  // Initialize deniedMcpServers if it doesn't exist
  if (!config.deniedMcpServers) {
    config.deniedMcpServers = [];
  }

  // Check if server is already denied
  const alreadyDenied = config.deniedMcpServers.some((denied) => denied.serverName === serverName);

  if (!alreadyDenied) {
    config.deniedMcpServers.push({ serverName });
  }

  // Write updated config
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write config: ${error}`);
  }
}
