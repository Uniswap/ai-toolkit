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

  /**
   * Installation mode from parent generator (default or custom).
   * When set to 'default', skips all prompts and uses defaults.
   * This is passed programmatically from the init generator.
   * @hidden
   */
  installMode?: 'default' | 'custom';
}
