import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type {
  ClaudeConfig,
  McpConfig,
  SettingsLocal,
  ServerStatus,
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
 * Get all available MCP server names from all sources:
 * 1. Global ~/.claude.json mcpServers
 * 2. Project-specific ~/.claude.json projects[cwd].mcpServers
 * 3. Project-local ./.mcp.json
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
    Object.keys(globalConfig.projects[cwd].mcpServers!).forEach((name) =>
      servers.add(name)
    );
  }

  // 3. Project-local MCP servers from ./.mcp.json
  const mcpConfig = readMcpJsonConfig();
  if (mcpConfig.mcpServers) {
    Object.keys(mcpConfig.mcpServers).forEach((name) => servers.add(name));
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

  return localConfig.deniedMcpServers.some(
    (denied) => denied.serverName === serverName
  );
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
 * Get status for all available servers
 */
export function getAllServerStatuses(): ServerStatus[] {
  const servers = getAvailableServers();
  return servers.map((name) => getServerStatus(name));
}

/**
 * Check if MCP servers are configured
 */
export function hasMcpServers(): boolean {
  const servers = getAvailableServers();
  return servers.length > 0;
}
