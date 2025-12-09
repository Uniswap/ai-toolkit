/**
 * Schema for skills generator
 */
export interface SkillsGeneratorSchema {
  /**
   * Selection mode for which skills to install
   */
  selectionMode?: 'all' | 'specific';

  /**
   * The skills to install
   */
  skills?: string[];

  /**
   * Where to install skills
   */
  installationType?: 'global' | 'local';

  /**
   * Force installation even if skill already exists
   */
  force?: boolean;

  /**
   * Dry run mode - preview changes without making them
   */
  dry?: boolean;

  /**
   * Installation mode from parent generator (default or custom)
   */
  installMode?: 'default' | 'custom';
}
