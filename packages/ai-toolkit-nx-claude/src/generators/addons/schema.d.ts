export interface AddonsGeneratorSchema {
  /** Installation mode */
  installMode?: 'all' | 'specific';
  /** The addon to install */
  addon?:
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
    | 'supabase-mcp';
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
}
