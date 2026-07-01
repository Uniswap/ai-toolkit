export interface AddonsGeneratorSchema {
  /** Selection mode for which addons to install */
  selectionMode?: 'all' | 'specific';
  /** The addons to install (note: slack-mcp is now available via uniswap-integrations plugin) */
  addons?: Array<'aws-log-analyzer-mcp'>;
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
