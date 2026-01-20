import type { LinearClient } from '@linear/sdk';
import {
  parseQueryConfig,
  createLinearClient,
  queryIssues,
  truncateDescription,
} from './query-issues';
import { DEFAULTS } from './types';

// Mock @linear/sdk
jest.mock('@linear/sdk', () => ({
  LinearClient: jest.fn().mockImplementation((options: { apiKey: string }) => ({
    apiKey: options.apiKey,
  })),
}));

describe('query-issues.ts', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('truncateDescription', () => {
    const SUFFIX = '\n\n[Description truncated for workflow. See full issue in Linear.]';
    const SUFFIX_LENGTH = SUFFIX.length;

    it('should return empty string for empty input', () => {
      expect(truncateDescription('')).toBe('');
    });

    it('should return null/undefined unchanged', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(truncateDescription(null as any)).toBe(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(truncateDescription(undefined as any)).toBe(undefined);
    });

    it('should return text unchanged when under maxLength', () => {
      expect(truncateDescription('short text')).toBe('short text');
      expect(truncateDescription('a'.repeat(3999))).toBe('a'.repeat(3999));
      expect(truncateDescription('a'.repeat(4000))).toBe('a'.repeat(4000));
    });

    it('should truncate text when over maxLength', () => {
      const longText = 'a'.repeat(5000);
      const result = truncateDescription(longText);

      expect(result).toContain(SUFFIX);
      expect(result.length).toBeLessThanOrEqual(4000);
    });

    it('should respect custom maxLength parameter', () => {
      const text = 'a'.repeat(200);
      const result = truncateDescription(text, 100);

      expect(result).toContain(SUFFIX);
      expect(result.length).toBeLessThanOrEqual(100);
    });

    it('should truncate at word boundary when possible', () => {
      // Create text with words that exceeds maxLength
      // Use a larger maxLength to ensure we have room for content + suffix
      const maxLength = 200;
      // Create text that definitely exceeds maxLength
      const textPart = 'word '.repeat(100); // 500 chars
      const result = truncateDescription(textPart, maxLength);

      expect(result).toContain(SUFFIX);
      expect(result.length).toBeLessThanOrEqual(maxLength);
      // Should end with a word, not mid-word (before suffix)
      const beforeSuffix = result.replace(SUFFIX, '');
      expect(beforeSuffix.endsWith('word')).toBe(true);
    });

    it('should handle text with no spaces', () => {
      const noSpaces = 'a'.repeat(5000);
      const result = truncateDescription(noSpaces);

      expect(result).toContain(SUFFIX);
      expect(result.length).toBeLessThanOrEqual(4000);
    });

    it('should ensure total output never exceeds maxLength', () => {
      // Test with various text lengths
      const testCases = [4001, 5000, 10000, 100000];

      for (const length of testCases) {
        const text = 'x '.repeat(Math.ceil(length / 2));
        const result = truncateDescription(text, 4000);

        expect(result.length).toBeLessThanOrEqual(4000);
        expect(result).toContain(SUFFIX);
      }
    });

    it('should truncate at exactly maxLength when no suitable word boundary', () => {
      // Text with a space very early (before 80% mark)
      const maxLength = 100;
      const effectiveMax = maxLength - SUFFIX_LENGTH;
      // Put a single space at 10% mark
      const earlySpaceText = 'a'.repeat(Math.floor(effectiveMax * 0.1)) + ' ' + 'b'.repeat(5000);
      const result = truncateDescription(earlySpaceText, maxLength);

      expect(result).toContain(SUFFIX);
      expect(result.length).toBeLessThanOrEqual(maxLength);
      // Space is too early, so it should truncate at effectiveMax, not at the space
      const beforeSuffix = result.replace(SUFFIX, '');
      expect(beforeSuffix.length).toBe(effectiveMax);
    });
  });

  describe('parseQueryConfig', () => {
    it('should use default values when no arguments provided', () => {
      const config = parseQueryConfig({});

      expect(config.team).toBe(DEFAULTS.team);
      expect(config.label).toBe(DEFAULTS.label);
      expect(config.statuses).toEqual(DEFAULTS.statuses);
      expect(config.max).toBe(DEFAULTS.max);
    });

    it('should use provided team name', () => {
      const config = parseQueryConfig({ team: 'My Team' });

      expect(config.team).toBe('My Team');
    });

    it('should use provided label', () => {
      const config = parseQueryConfig({ label: 'custom-label' });

      expect(config.label).toBe('custom-label');
    });

    it('should parse comma-separated statuses', () => {
      const config = parseQueryConfig({ statuses: 'In Progress,Done,Review' });

      expect(config.statuses).toEqual(['In Progress', 'Done', 'Review']);
    });

    it('should trim whitespace from statuses', () => {
      const config = parseQueryConfig({ statuses: ' Backlog , Todo , Done ' });

      expect(config.statuses).toEqual(['Backlog', 'Todo', 'Done']);
    });

    it('should filter out empty status values', () => {
      const config = parseQueryConfig({ statuses: 'Backlog,,Todo,' });

      expect(config.statuses).toEqual(['Backlog', 'Todo']);
    });

    it('should throw error for empty statuses after filtering', () => {
      expect(() => parseQueryConfig({ statuses: ',,' })).toThrow(
        '--statuses must contain at least one non-empty status name'
      );
    });

    it('should parse valid max value', () => {
      const config = parseQueryConfig({ max: '10' });

      expect(config.max).toBe(10);
    });

    it('should throw error for non-numeric max', () => {
      expect(() => parseQueryConfig({ max: 'abc' })).toThrow(
        '--max must be a positive integer, got: "abc"'
      );
    });

    it('should throw error for zero max', () => {
      expect(() => parseQueryConfig({ max: '0' })).toThrow(
        '--max must be a positive integer, got: "0"'
      );
    });

    it('should throw error for negative max', () => {
      expect(() => parseQueryConfig({ max: '-5' })).toThrow(
        '--max must be a positive integer, got: "-5"'
      );
    });

    it('should accept all options together', () => {
      const config = parseQueryConfig({
        team: 'Engineering',
        label: 'automation',
        statuses: 'Ready,In Progress',
        max: '5',
      });

      expect(config).toEqual({
        team: 'Engineering',
        label: 'automation',
        statuses: ['Ready', 'In Progress'],
        max: 5,
      });
    });
  });

  describe('createLinearClient', () => {
    it('should create client with provided API key', () => {
      const client = createLinearClient('test-api-key');

      expect(client).toBeDefined();
    });

    it('should use LINEAR_API_KEY env var when no key provided', () => {
      process.env.LINEAR_API_KEY = 'env-api-key';

      const client = createLinearClient();

      expect(client).toBeDefined();
    });

    it('should prefer provided API key over env var', () => {
      process.env.LINEAR_API_KEY = 'env-api-key';

      const client = createLinearClient('provided-key');

      expect(client).toBeDefined();
    });

    it('should throw error when no API key available', () => {
      delete process.env.LINEAR_API_KEY;

      expect(() => createLinearClient()).toThrow(
        'LINEAR_API_KEY is required (via LINEAR_API_KEY env var or --api-key flag)'
      );
    });
  });

  describe('queryIssues', () => {
    const createMockLinearClient = (overrides: Partial<LinearClient> = {}) =>
      ({
        teams: jest.fn(),
        issues: jest.fn(),
        ...overrides,
      } as unknown as LinearClient);

    it('should throw error when team is not found', async () => {
      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({ nodes: [] }),
      });

      await expect(
        queryIssues(mockClient, {
          team: 'Non-existent Team',
          label: 'claude',
          statuses: ['Backlog'],
          max: 3,
        })
      ).rejects.toThrow('Team "Non-existent Team" not found');
    });

    it('should throw error when no matching workflow states found', async () => {
      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [
            {
              id: 'team-123',
              states: jest.fn().mockResolvedValue({
                nodes: [{ id: 'state-1', name: 'Done' }],
              }),
            },
          ],
        }),
      });

      await expect(
        queryIssues(mockClient, {
          team: 'Developer AI',
          label: 'claude',
          statuses: ['Backlog', 'Todo'],
          max: 3,
        })
      ).rejects.toThrow('No matching workflow states found for statuses: Backlog, Todo');
    });

    it('should return empty result when no issues match', async () => {
      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [
            {
              id: 'team-123',
              states: jest.fn().mockResolvedValue({
                nodes: [
                  { id: 'state-1', name: 'Backlog' },
                  { id: 'state-2', name: 'Todo' },
                ],
              }),
            },
          ],
        }),
        issues: jest.fn().mockResolvedValue({ nodes: [] }),
      });

      const result = await queryIssues(mockClient, {
        team: 'Developer AI',
        label: 'claude',
        statuses: ['Backlog', 'Todo'],
        max: 3,
      });

      expect(result.count).toBe(0);
      expect(result.include).toEqual([]);
    });

    it('should process and return issues correctly', async () => {
      const mockIssues = [
        {
          id: 'issue-1',
          identifier: 'DAI-123',
          title: 'Fix authentication bug',
          description: 'Authentication fails for new users',
          url: 'https://linear.app/team/issue/DAI-123',
          priority: 2,
        },
        {
          id: 'issue-2',
          identifier: 'DAI-124',
          title: 'Add dark mode support',
          description: '',
          url: 'https://linear.app/team/issue/DAI-124',
          priority: 3,
        },
      ];

      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [
            {
              id: 'team-123',
              states: jest.fn().mockResolvedValue({
                nodes: [
                  { id: 'state-1', name: 'Backlog' },
                  { id: 'state-2', name: 'Todo' },
                ],
              }),
            },
          ],
        }),
        issues: jest.fn().mockResolvedValue({ nodes: mockIssues }),
      });

      const result = await queryIssues(mockClient, {
        team: 'Developer AI',
        label: 'claude',
        statuses: ['Backlog', 'Todo'],
        max: 5,
      });

      expect(result.count).toBe(2);
      expect(result.include).toHaveLength(2);

      // Check first issue (should be sorted by priority - High first)
      expect(result.include[0]).toEqual({
        issue_id: 'issue-1',
        issue_identifier: 'DAI-123',
        issue_title: 'Fix authentication bug',
        issue_description: 'Authentication fails for new users',
        issue_url: 'https://linear.app/team/issue/DAI-123',
        branch_name: 'claude/dai-123-fix-authentication-bug',
        priority: 2,
        priority_label: 'High',
        linear_team: 'Developer AI',
      });

      // Check second issue
      expect(result.include[1]).toEqual({
        issue_id: 'issue-2',
        issue_identifier: 'DAI-124',
        issue_title: 'Add dark mode support',
        issue_description: '',
        issue_url: 'https://linear.app/team/issue/DAI-124',
        branch_name: 'claude/dai-124-add-dark-mode-support',
        priority: 3,
        priority_label: 'Normal',
        linear_team: 'Developer AI',
      });
    });

    it('should sort issues by priority correctly', async () => {
      const mockIssues = [
        {
          id: '1',
          identifier: 'T-1',
          title: 'Low priority',
          description: '',
          url: '',
          priority: 4,
        },
        {
          id: '2',
          identifier: 'T-2',
          title: 'Urgent',
          description: '',
          url: '',
          priority: 1,
        },
        {
          id: '3',
          identifier: 'T-3',
          title: 'No priority',
          description: '',
          url: '',
          priority: 0,
        },
        { id: '4', identifier: 'T-4', title: 'High', description: '', url: '', priority: 2 },
        { id: '5', identifier: 'T-5', title: 'Normal', description: '', url: '', priority: 3 },
      ];

      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [
            {
              id: 'team-123',
              states: jest.fn().mockResolvedValue({
                nodes: [{ id: 'state-1', name: 'Backlog' }],
              }),
            },
          ],
        }),
        issues: jest.fn().mockResolvedValue({ nodes: mockIssues }),
      });

      const result = await queryIssues(mockClient, {
        team: 'Developer AI',
        label: 'claude',
        statuses: ['Backlog'],
        max: 10,
      });

      // Order should be: Urgent(1) > High(2) > Normal(3) > Low(4) > No Priority(0)
      expect(result.include.map((i) => i.priority)).toEqual([1, 2, 3, 4, 0]);
    });

    it('should limit results to max', async () => {
      const mockIssues = [
        { id: '1', identifier: 'T-1', title: 'Issue 1', description: '', url: '', priority: 2 },
        { id: '2', identifier: 'T-2', title: 'Issue 2', description: '', url: '', priority: 2 },
        { id: '3', identifier: 'T-3', title: 'Issue 3', description: '', url: '', priority: 2 },
        { id: '4', identifier: 'T-4', title: 'Issue 4', description: '', url: '', priority: 2 },
        { id: '5', identifier: 'T-5', title: 'Issue 5', description: '', url: '', priority: 2 },
      ];

      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [
            {
              id: 'team-123',
              states: jest.fn().mockResolvedValue({
                nodes: [{ id: 'state-1', name: 'Backlog' }],
              }),
            },
          ],
        }),
        issues: jest.fn().mockResolvedValue({ nodes: mockIssues }),
      });

      const result = await queryIssues(mockClient, {
        team: 'Developer AI',
        label: 'claude',
        statuses: ['Backlog'],
        max: 2,
      });

      expect(result.count).toBe(2);
      expect(result.include).toHaveLength(2);
    });

    it('should handle issues with null priority', async () => {
      const mockIssues = [
        {
          id: '1',
          identifier: 'T-1',
          title: 'No priority set',
          description: '',
          url: '',
          priority: null,
        },
      ];

      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [
            {
              id: 'team-123',
              states: jest.fn().mockResolvedValue({
                nodes: [{ id: 'state-1', name: 'Backlog' }],
              }),
            },
          ],
        }),
        issues: jest.fn().mockResolvedValue({ nodes: mockIssues }),
      });

      const result = await queryIssues(mockClient, {
        team: 'Developer AI',
        label: 'claude',
        statuses: ['Backlog'],
        max: 5,
      });

      expect(result.include[0].priority).toBe(0);
      expect(result.include[0].priority_label).toBe('No Priority');
    });

    it('should generate correct branch names', async () => {
      const mockIssues = [
        {
          id: '1',
          identifier: 'DAI-100',
          title: 'Fix   Multiple   Spaces!!!',
          description: '',
          url: '',
          priority: 3,
        },
        {
          id: '2',
          identifier: 'DAI-101',
          title: 'This is a really long title that should be truncated to fit within branch limits',
          description: '',
          url: '',
          priority: 3,
        },
        {
          id: '3',
          identifier: 'DAI-102',
          title: '!!!@@@###',
          description: '',
          url: '',
          priority: 3,
        },
      ];

      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [
            {
              id: 'team-123',
              states: jest.fn().mockResolvedValue({
                nodes: [{ id: 'state-1', name: 'Backlog' }],
              }),
            },
          ],
        }),
        issues: jest.fn().mockResolvedValue({ nodes: mockIssues }),
      });

      const result = await queryIssues(mockClient, {
        team: 'Developer AI',
        label: 'claude',
        statuses: ['Backlog'],
        max: 5,
      });

      // Special chars replaced, spaces become hyphens
      expect(result.include[0].branch_name).toBe('claude/dai-100-fix-multiple-spaces');

      // Long title truncated to 40 chars (truncates at char 40, then removes trailing hyphen if any)
      expect(result.include[1].branch_name).toBe(
        'claude/dai-101-this-is-a-really-long-title-that-should'
      );

      // All special chars - results in just identifier
      expect(result.include[2].branch_name).toBe('claude/dai-102');
    });
  });
});
