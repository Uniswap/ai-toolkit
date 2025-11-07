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
 * Status information for an MCP server
 */
export interface ServerStatus {
  name: string;
  enabled: boolean;
  source: 'local' | 'global' | 'none';
}

/**
 * Project-local MCP configuration (.mcp.json)
 */
export interface McpConfig {
  mcpServers?: Record<string, McpServerConfig>;
}
