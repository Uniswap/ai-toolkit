type CommandName =
  | 'explain-file'
  | 'fix-bug'
  | 'gen-tests'
  | 'plan'
  | 'plan-feature'
  | 'refactor'
  | 'research'
  | 'review-pr'
  | 'understand-area';

export type Commands = {
  [key in CommandName]: {
    description: string;
    filePath: string;
  };
};

export const commands: Commands = {
  'explain-file': {
    description: 'Explain code structure and functionality',
    filePath: './explain-file.md',
  },
  'fix-bug': {
    description: 'Debug and fix issues in code',
    filePath: './fix-bug.md',
  },
  'gen-tests': {
    description: 'Generate comprehensive test suites',
    filePath: './gen-tests.md',
  },
  plan: {
    description:
      'Create a detailed implementation plan for a task without writing code',
    filePath: './plan.md',
  },
  'plan-feature': {
    description: 'Plan implementation for new features',
    filePath: './plan-feature.md',
  },
  refactor: {
    description: 'Refactor code for better structure',
    filePath: './refactor.md',
  },
  research: {
    description:
      'Research a topic by combining web search with codebase analysis',
    filePath: './research.md',
  },
  'review-pr': {
    description: 'Review pull requests for quality',
    filePath: './review-pr.md',
  },
  'understand-area': {
    description: 'Deep dive into codebase areas before implementation',
    filePath: './understand-area.md',
  },
} as const;
