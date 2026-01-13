import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type {
  ClaudeConfig,
  InstalledPluginsConfig,
  McpConfig,
  ServerOrigin,
  ServerStatus,
  SettingsLocal,
} from './types';

/**
 * Path to global Claude configuration
 */
export function getGlobalConfigPath(): string {
  return join(homedir(), '.claude.json');
}

/**
 * Path to local project settings
 */
export function getLocalConfigPath(): string {
  return join(process.cwd(), '.claude', 'settings.local.json');
}

/**
 * Path to project-local MCP configuration
 */
export function getMcpJsonConfigPath(): string {
  return join(process.cwd(), '.mcp.json');
}

/**
 * Path to installed plugins configuration
 */
export function getInstalledPluginsPath(): string {
  return join(homedir(), '.claude', 'plugins', 'installed_plugins.json');
}

/**
 * Read global Claude configuration from ~/.claude.json
 */
export function readGlobalConfig(): ClaudeConfig {
  const configPath = getGlobalConfigPath();

  if (!existsSync(configPath)) {
    return {};
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as ClaudeConfig;
  } catch (error) {
    console.error(`Failed to read global config: ${error}`);
    return {};
  }
}

/**
 * Read local project settings from ./.claude/settings.local.json
 */
export function readLocalConfig(): SettingsLocal {
  const configPath = getLocalConfigPath();

  if (!existsSync(configPath)) {
    return {};
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as SettingsLocal;
  } catch (error) {
    console.error(`Failed to read local config: ${error}`);
    return {};
  }
}

/**
 * Read project-local MCP configuration from ./.mcp.json
 */
export function readMcpJsonConfig(): McpConfig {
  const configPath = getMcpJsonConfigPath();

  if (!existsSync(configPath)) {
    return {};
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as McpConfig;
  } catch (error) {
    console.error(`Failed to read .mcp.json config: ${error}`);
    return {};
  }
}

/**
 * Read installed plugins configuration from ~/.claude/plugins/installed_plugins.json
 */
export function readInstalledPlugins(): InstalledPluginsConfig {
  const configPath = getInstalledPluginsPath();

  if (!existsSync(configPath)) {
    return { version: 2, plugins: {} };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as InstalledPluginsConfig;
  } catch (error) {
    console.error(`Failed to read installed plugins: ${error}`);
    return { version: 2, plugins: {} };
  }
}

/**
 * Server info with its origin for grouping in UI
 */
export interface ServerInfo {
  name: string;
  origin: ServerOrigin;
}

/**
 * Read MCP configuration from a specific plugin install path
 */
function readPluginMcpConfig(installPath: string): McpConfig {
  const mcpJsonPath = join(installPath, '.mcp.json');

  if (!existsSync(mcpJsonPath)) {
    return {};
  }

  try {
    const content = readFileSync(mcpJsonPath, 'utf-8');
    return JSON.parse(content) as McpConfig;
  } catch {
    // Silently ignore plugin MCP config read errors
    return {};
  }
}

/**
 * Extract plugin name from the plugin key in installed_plugins.json
 * Format: "pluginName@marketplaceName" -> "pluginName"
 */
function extractPluginName(pluginKey: string): string {
  const atIndex = pluginKey.indexOf('@');
  return atIndex > 0 ? pluginKey.substring(0, atIndex) : pluginKey;
}

/**
 * Get all MCP servers from installed plugins
 * Returns a map of server name to plugin name
 */
export function getPluginMcpServers(): Map<string, string> {
  const serverToPlugin = new Map<string, string>();
  const installedPlugins = readInstalledPlugins();

  for (const [pluginKey, installations] of Object.entries(installedPlugins.plugins)) {
    // Use the first installation (typically there's only one)
    const installation = installations[0];
    if (!installation?.installPath) continue;

    const pluginName = extractPluginName(pluginKey);
    const mcpConfig = readPluginMcpConfig(installation.installPath);

    if (mcpConfig.mcpServers) {
      for (const serverName of Object.keys(mcpConfig.mcpServers)) {
        // Don't overwrite if already registered by another plugin
        if (!serverToPlugin.has(serverName)) {
          serverToPlugin.set(serverName, pluginName);
        }
      }
    }
  }

  return serverToPlugin;
}

/**
 * Get all servers with their origin information for UI grouping
 * This function tracks where each server was discovered from
 */
export function getServersWithOrigins(): ServerInfo[] {
  const servers: ServerInfo[] = [];
  const seenServers = new Set<string>();
  const cwd = process.cwd();

  // 1. Global MCP servers from ~/.claude.json
  const globalConfig = readGlobalConfig();
  if (globalConfig.mcpServers) {
    for (const name of Object.keys(globalConfig.mcpServers)) {
      if (!seenServers.has(name)) {
        seenServers.add(name);
        servers.push({ name, origin: { type: 'global' } });
      }
    }
  }

  // 2. Project-specific MCP servers from ~/.claude.json projects[cwd].mcpServers
  if (globalConfig.projects?.[cwd]?.mcpServers) {
    for (const name of Object.keys(globalConfig.projects[cwd].mcpServers!)) {
      if (!seenServers.has(name)) {
        seenServers.add(name);
        servers.push({ name, origin: { type: 'project' } });
      }
    }
  }

  // 3. Project-local MCP servers from ./.mcp.json
  const mcpConfig = readMcpJsonConfig();
  if (mcpConfig.mcpServers) {
    for (const name of Object.keys(mcpConfig.mcpServers)) {
      if (!seenServers.has(name)) {
        seenServers.add(name);
        servers.push({ name, origin: { type: 'local' } });
      }
    }
  }

  // 4. Plugin MCP servers from installed plugins
  const pluginServers = getPluginMcpServers();
  for (const [serverName, pluginName] of pluginServers) {
    if (!seenServers.has(serverName)) {
      seenServers.add(serverName);
      servers.push({ name: serverName, origin: { type: 'plugin', pluginName } });
    }
  }

  // Sort alphabetically by name
  return servers.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all available MCP server names from all sources:
 * 1. Global ~/.claude.json mcpServers
 * 2. Project-specific ~/.claude.json projects[cwd].mcpServers
 * 3. Project-local ./.mcp.json
 * 4. Installed plugins' .mcp.json files
 */
export function getAvailableServers(): string[] {
  const servers = new Set<string>();
  const cwd = process.cwd();

  // 1. Global MCP servers from ~/.claude.json
  const globalConfig = readGlobalConfig();
  if (globalConfig.mcpServers) {
    Object.keys(globalConfig.mcpServers).forEach((name) => servers.add(name));
  }

  // 2. Project-specific MCP servers from ~/.claude.json projects[cwd].mcpServers
  if (globalConfig.projects?.[cwd]?.mcpServers) {
    Object.keys(globalConfig.projects[cwd].mcpServers!).forEach((name) => servers.add(name));
  }

  // 3. Project-local MCP servers from ./.mcp.json
  const mcpConfig = readMcpJsonConfig();
  if (mcpConfig.mcpServers) {
    Object.keys(mcpConfig.mcpServers).forEach((name) => servers.add(name));
  }

  // 4. Plugin MCP servers from installed plugins
  const pluginServers = getPluginMcpServers();
  for (const serverName of pluginServers.keys()) {
    servers.add(serverName);
  }

  return Array.from(servers).sort();
}

/**
 * Check if a server is denied in the local configuration
 */
function isServerDeniedLocally(serverName: string): boolean {
  const localConfig = readLocalConfig();

  if (!localConfig.deniedMcpServers) {
    return false;
  }

  return localConfig.deniedMcpServers.some((denied) => denied.serverName === serverName);
}

/**
 * Check if a server is disabled in the global configuration for current project
 */
function isServerDisabledGlobally(serverName: string): boolean {
  const globalConfig = readGlobalConfig();
  const cwd = process.cwd();

  if (!globalConfig.projects || !globalConfig.projects[cwd]) {
    return false;
  }

  const projectConfig = globalConfig.projects[cwd];

  return projectConfig.disabledMcpServers?.includes(serverName) ?? false;
}

/**
 * Get the status of an MCP server
 * Local configuration takes precedence over global configuration
 */
export function getServerStatus(serverName: string): ServerStatus {
  // 1. Check local config first (takes precedence)
  if (isServerDeniedLocally(serverName)) {
    return {
      name: serverName,
      enabled: false,
      source: 'local',
    };
  }

  // 2. Check global config for current project
  if (isServerDisabledGlobally(serverName)) {
    return {
      name: serverName,
      enabled: false,
      source: 'global',
    };
  }

  // 3. Default: enabled
  return {
    name: serverName,
    enabled: true,
    source: 'none',
  };
}

/**
 * Get status for all available servers with their origins
 */
export function getAllServerStatuses(): ServerStatus[] {
  const serversWithOrigins = getServersWithOrigins();

  return serversWithOrigins.map((serverInfo) => {
    const status = getServerStatus(serverInfo.name);
    return {
      ...status,
      origin: serverInfo.origin,
    };
  });
}

/**
 * Check if MCP servers are configured
 */
export function hasMcpServers(): boolean {
  const servers = getAvailableServers();
  return servers.length > 0;
}
