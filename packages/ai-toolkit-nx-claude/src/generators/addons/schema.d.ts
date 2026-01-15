export interface AddonsGeneratorSchema {
  /** Selection mode for which addons to install */
  selectionMode?: 'all' | 'specific';
  /** The addons to install */
  addons?: Array<'slack-mcp' | 'github-mcp' | 'aws-log-analyzer-mcp'>;
  /** Force installation even if already exists */
  force?: boolean;
  /** Skip installation verification */
  skipVerification?: boolean;
  /** Dry run mode */
  dry?: boolean;
  /** Installation mode from parent generator (default or custom) */
  installMode?: 'default' | 'custom';
  /** Installation location for MCP servers */
  installationType?: 'global' | 'local';
}
