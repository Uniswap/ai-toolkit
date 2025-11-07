import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type { DeniedMcpServer, SettingsLocal } from './types';
import { getLocalConfigPath } from './reader';

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
 * Update local configuration with denied servers
 * @param deniedServers Array of server names that should be denied
 */
export function updateLocalConfig(deniedServers: string[]): void {
  ensureClaudeDirectory();

  const configPath = getLocalConfigPath();
  let config: SettingsLocal = {};

  // Read existing config if it exists
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      config = JSON.parse(content) as SettingsLocal;
    } catch (error) {
      console.error(
        `Failed to read existing config, creating new one: ${error}`
      );
      config = {};
    }
  }

  // Update deniedMcpServers array with object format
  config.deniedMcpServers = deniedServers.map(
    (serverName): DeniedMcpServer => ({ serverName })
  );

  // Write updated config
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write config: ${error}`);
  }
}

/**
 * Enable a server by removing it from deniedMcpServers
 */
export function enableServer(serverName: string): void {
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
 * Disable a server by adding it to deniedMcpServers
 */
export function disableServer(serverName: string): void {
  ensureClaudeDirectory();

  const configPath = getLocalConfigPath();
  let config: SettingsLocal = {};

  // Read existing config if it exists
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      config = JSON.parse(content) as SettingsLocal;
    } catch (error) {
      console.error(
        `Failed to read existing config, creating new one: ${error}`
      );
      config = {};
    }
  }

  // Initialize deniedMcpServers if it doesn't exist
  if (!config.deniedMcpServers) {
    config.deniedMcpServers = [];
  }

  // Check if server is already denied
  const alreadyDenied = config.deniedMcpServers.some(
    (denied) => denied.serverName === serverName
  );

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
