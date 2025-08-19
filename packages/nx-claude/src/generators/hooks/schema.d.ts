/**
 * Schema for the Claude Code hooks generator
 * Installs notification hooks for Claude Code
 */
export interface HooksGeneratorSchema {
  /**
   * Backup existing hooks configuration before installation
   * @default true
   */
  backup?: boolean;

  /**
   * Preview installation without making changes
   * @default false
   */
  dry?: boolean;

  /**
   * Skip confirmation prompts and overwrite existing configuration
   * @default false
   */
  force?: boolean;

  /**
   * Show detailed output during installation
   * @default false
   */
  verbose?: boolean;
}
