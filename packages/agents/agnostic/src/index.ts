// Agent types
type Agent =
  | 'code-explainer'
  | 'debug-assistant'
  | 'doc-writer'
  | 'refactorer'
  | 'style-enforcer'
  | 'test-writer';

type Agents = {
  [key in Agent]: {
    description: string;
    filePath: string;
  };
};

// Export agents with descriptions and file paths
export const agents: Agents = {
  'code-explainer': {
    description: 'Analyze and explain complex code',
    filePath: './code-explainer.md',
  },
  'debug-assistant': {
    description: 'Help identify and fix bugs',
    filePath: './debug-assistant.md',
  },
  'doc-writer': {
    description: 'Generate documentation and comments',
    filePath: './doc-writer.md',
  },
  refactorer: {
    description: 'Improve code structure and design',
    filePath: './refactorer.md',
  },
  'style-enforcer': {
    description: 'Ensure code style consistency',
    filePath: './style-enforcer.md',
  },
  'test-writer': {
    description: 'Create comprehensive test cases',
    filePath: './test-writer.md',
  },
} as const;

export type AgentName = keyof typeof agents;
