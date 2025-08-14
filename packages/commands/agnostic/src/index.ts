// Export command file paths for use by the nx-claude plugin
export const commands = {
  'explain-file': './explain-file.md',
  'fix-bug': './fix-bug.md',
  'gen-tests': './gen-tests.md',
  'plan-feature': './plan-feature.md',
  'refactor': './refactor.md',
  'review-pr': './review-pr.md',
} as const;

export type CommandName = keyof typeof commands;