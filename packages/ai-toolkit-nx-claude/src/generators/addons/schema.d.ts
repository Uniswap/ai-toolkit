export interface AddonsGeneratorSchema {
  /** The addon to install */
  addon?: 'spec-workflow-mcp';
  /** Dashboard startup mode */
  dashboardMode?: 'always' | 'ask' | 'manual';
  /** Dashboard port (default: auto) */
  port?: number;
  /** GitHub personal access token for private packages */
  githubToken?: string;
  /** Force installation even if already exists */
  force?: boolean;
  /** Skip installation verification */
  skipVerification?: boolean;
}
