// Agent types
type Agent =
  | 'context-loader'
  | 'code-explainer'
  | 'debug-assistant'
  | 'doc-writer'
  | 'refactorer'
  | 'researcher'
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
  'context-loader': {
    description:
      'Deep dive and understand codebase areas before implementation',
    filePath: './context-loader.md',
  },
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
  researcher: {
    description:
      'Conduct comprehensive research by combining web docs with codebase analysis',
    filePath: './researcher.md',
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
