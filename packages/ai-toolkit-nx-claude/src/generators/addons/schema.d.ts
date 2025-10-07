export interface AddonsGeneratorSchema {
  /** The addon to install */
  addon?: 'spec-workflow-mcp';
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
}
