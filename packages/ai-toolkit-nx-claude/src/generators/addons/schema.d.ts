export interface AddonsGeneratorSchema {
  /** Selection mode for which addons to install */
  selectionMode?: 'all' | 'specific';
  /** The addons to install */
  addons?: Array<
    | 'spec-workflow-mcp'
    | 'graphite-mcp'
    | 'nx-mcp'
    | 'slack-mcp'
    | 'universe-mcp'
    | 'linear-mcp'
    | 'notion-mcp'
    | 'github-mcp'
    | 'figma-mcp'
    | 'chrome-devtools-mcp'
    | 'vercel-mcp'
    | 'supabase-mcp'
    | 'aws-log-analyzer-mcp'
    | 'pulumi-mcp'
  >;
  /** Dashboard startup mode */
  dashboardMode?: 'always' | 'manual';
  /** Dashboard port (default: auto) */
  port?: number;
  /** Force installation even if already exists */
  force?: boolean;
  /** Skip installation verification */
  skipVerification?: boolean;
  /** Path to the project where spec-workflow should be installed */
  projectPath?: string;
  /** Dry run mode */
  dry?: boolean;
  /** Installation mode from parent generator (default or custom) */
  installMode?: 'default' | 'custom';
  /** Installation location for MCP servers */
  installationType?: 'global' | 'local';
}
