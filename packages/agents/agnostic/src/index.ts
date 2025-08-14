// Export agent file paths for use by the nx-claude plugin
export const agents = {
  'code-explainer': './code-explainer.md',
  'debug-assistant': './debug-assistant.md',
  'doc-writer': './doc-writer.md',
  'refactorer': './refactorer.md',
  'style-enforcer': './style-enforcer.md',
  'test-writer': './test-writer.md',
} as const;

export type AgentName = keyof typeof agents;