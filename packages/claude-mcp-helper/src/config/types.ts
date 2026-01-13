/**
 * Type definitions for MCP configuration files
 */

/**
 * Represents a denied MCP server in the deniedMcpServers array
 */
export interface DeniedMcpServer {
  serverName: string;
}

/**
 * Configuration for an MCP server
 */
export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  type?: 'stdio' | 'http' | 'sse';
  url?: string;
}

/**
 * Per-project configuration in global ~/.claude.json
 */
export interface ProjectConfig {
  mcpServers?: Record<string, McpServerConfig>;
  disabledMcpServers?: string[];
  enabledMcpjsonServers?: string[];
  disabledMcpjsonServers?: string[];
}

/**
 * Global Claude configuration (~/.claude.json)
 */
export interface ClaudeConfig {
  mcpServers?: Record<string, McpServerConfig>;
  projects?: Record<string, ProjectConfig>;
}

/**
 * Local project settings (.claude/settings.local.json)
 */
export interface SettingsLocal {
  permissions?: {
    allow?: string[];
    deny?: string[];
    ask?: string[];
  };
  deniedMcpServers?: DeniedMcpServer[];
}

/**
 * Origin of where an MCP server was discovered
 */
export type ServerOrigin =
  | { type: 'global' } // From ~/.claude.json mcpServers
  | { type: 'project' } // From ~/.claude.json projects[cwd].mcpServers
  | { type: 'local' } // From ./.mcp.json
  | { type: 'plugin'; pluginName: string }; // From installed plugin

/**
 * Status information for an MCP server
 */
export interface ServerStatus {
  name: string;
  enabled: boolean;
  /** Where the disabled state was configured (for UI hints) */
  source: 'local' | 'global' | 'none';
  /** Where the server was discovered from */
  origin?: ServerOrigin;
}

/**
 * Single plugin installation entry in installed_plugins.json
 */
export interface PluginInstallation {
  scope: 'user' | 'project';
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha?: string;
}

/**
 * Installed plugins configuration (~/.claude/plugins/installed_plugins.json)
 */
export interface InstalledPluginsConfig {
  version: number;
  plugins: Record<string, PluginInstallation[]>;
}

/**
 * Project-local MCP configuration (.mcp.json)
 */
export interface McpConfig {
  mcpServers?: Record<string, McpServerConfig>;
}
