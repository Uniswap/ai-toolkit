import type { LinearClient } from '@linear/sdk';
import { ensureLabel, parseEnsureLabelConfig } from './ensure-label';
import { DEFAULTS } from './types';

describe('ensure-label.ts', () => {
  describe('parseEnsureLabelConfig', () => {
    it('should use default values when no arguments provided', () => {
      const config = parseEnsureLabelConfig({});

      expect(config.team).toBe(DEFAULTS.team);
      expect(config.label).toBe(DEFAULTS.label);
      expect(config.color).toBe(DEFAULTS.labelColor);
    });

    it('should use provided team name', () => {
      const config = parseEnsureLabelConfig({ team: 'Engineering' });

      expect(config.team).toBe('Engineering');
    });

    it('should use provided label name', () => {
      const config = parseEnsureLabelConfig({ label: 'automation' });

      expect(config.label).toBe('automation');
    });

    it('should use provided color', () => {
      const config = parseEnsureLabelConfig({ color: '#ff0000' });

      expect(config.color).toBe('#ff0000');
    });

    it('should accept all options together', () => {
      const config = parseEnsureLabelConfig({
        team: 'DevOps',
        label: 'ci-cd',
        color: '#00ff00',
      });

      expect(config).toEqual({
        team: 'DevOps',
        label: 'ci-cd',
        color: '#00ff00',
      });
    });
  });

  describe('ensureLabel', () => {
    const createMockLinearClient = (overrides: Partial<LinearClient> = {}) =>
      ({
        teams: jest.fn(),
        issueLabels: jest.fn(),
        createIssueLabel: jest.fn(),
        ...overrides,
      }) as unknown as LinearClient;

    it('should throw error when team is not found', async () => {
      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({ nodes: [] }),
      });

      await expect(
        ensureLabel(mockClient, {
          team: 'Non-existent Team',
          label: 'claude',
        })
      ).rejects.toThrow('Team "Non-existent Team" not found');
    });

    it('should return existing label when found in team', async () => {
      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [{ id: 'team-123' }],
        }),
        issueLabels: jest.fn().mockResolvedValue({
          nodes: [{ id: 'label-existing-123' }],
        }),
      });

      const result = await ensureLabel(mockClient, {
        team: 'Developer AI',
        label: 'claude',
      });

      expect(result.labelId).toBe('label-existing-123');
      expect(result.created).toBe(false);
    });

    it('should return existing workspace-level label', async () => {
      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [{ id: 'team-123' }],
        }),
        issueLabels: jest
          .fn()
          // First call - team-specific labels
          .mockResolvedValueOnce({ nodes: [] })
          // Second call - workspace labels
          .mockResolvedValueOnce({
            nodes: [
              {
                id: 'workspace-label-456',
                team: null, // Workspace label has no team
              },
            ],
          }),
      });

      const result = await ensureLabel(mockClient, {
        team: 'Developer AI',
        label: 'claude',
      });

      expect(result.labelId).toBe('workspace-label-456');
      expect(result.created).toBe(false);
    });

    it('should skip labels that belong to other teams when looking for workspace labels', async () => {
      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [{ id: 'team-123' }],
        }),
        issueLabels: jest
          .fn()
          // First call - team-specific labels (empty)
          .mockResolvedValueOnce({ nodes: [] })
          // Second call - workspace labels (all have teams)
          .mockResolvedValueOnce({
            nodes: [
              {
                id: 'other-team-label',
                team: Promise.resolve({ id: 'other-team-id' }),
              },
            ],
          }),
        createIssueLabel: jest.fn().mockResolvedValue({
          success: true,
          issueLabel: Promise.resolve({ id: 'new-label-789' }),
        }),
      });

      const result = await ensureLabel(mockClient, {
        team: 'Developer AI',
        label: 'claude',
        color: '#6366f1',
      });

      // Should create new label since no workspace-level label found
      expect(result.labelId).toBe('new-label-789');
      expect(result.created).toBe(true);
    });

    it('should create new label when not found', async () => {
      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [{ id: 'team-123' }],
        }),
        issueLabels: jest
          .fn()
          // First call - team-specific (empty)
          .mockResolvedValueOnce({ nodes: [] })
          // Second call - workspace (empty)
          .mockResolvedValueOnce({ nodes: [] }),
        createIssueLabel: jest.fn().mockResolvedValue({
          success: true,
          issueLabel: Promise.resolve({ id: 'new-label-789' }),
        }),
      });

      const result = await ensureLabel(mockClient, {
        team: 'Developer AI',
        label: 'claude',
        color: '#6366f1',
      });

      expect(result.labelId).toBe('new-label-789');
      expect(result.created).toBe(true);
      expect(mockClient.createIssueLabel).toHaveBeenCalledWith({
        name: 'claude',
        color: '#6366f1',
        teamId: 'team-123',
        description: 'Issues for autonomous Claude Code processing',
      });
    });

    it('should use default color when creating label', async () => {
      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [{ id: 'team-123' }],
        }),
        issueLabels: jest
          .fn()
          .mockResolvedValueOnce({ nodes: [] })
          .mockResolvedValueOnce({ nodes: [] }),
        createIssueLabel: jest.fn().mockResolvedValue({
          success: true,
          issueLabel: Promise.resolve({ id: 'new-label-789' }),
        }),
      });

      await ensureLabel(mockClient, {
        team: 'Developer AI',
        label: 'claude',
        // No color provided
      });

      expect(mockClient.createIssueLabel).toHaveBeenCalledWith(
        expect.objectContaining({
          color: DEFAULTS.labelColor,
        })
      );
    });

    it('should throw error when label creation fails', async () => {
      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [{ id: 'team-123' }],
        }),
        issueLabels: jest
          .fn()
          .mockResolvedValueOnce({ nodes: [] })
          .mockResolvedValueOnce({ nodes: [] }),
        createIssueLabel: jest.fn().mockResolvedValue({
          success: false,
          issueLabel: null,
        }),
      });

      await expect(
        ensureLabel(mockClient, {
          team: 'Developer AI',
          label: 'claude',
        })
      ).rejects.toThrow('Failed to create label "claude"');
    });

    it('should handle labels with awaitable team property', async () => {
      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [{ id: 'team-123' }],
        }),
        issueLabels: jest
          .fn()
          .mockResolvedValueOnce({ nodes: [] })
          .mockResolvedValueOnce({
            nodes: [
              {
                id: 'workspace-label',
                team: Promise.resolve(null), // Awaitable null (workspace-level)
              },
            ],
          }),
      });

      const result = await ensureLabel(mockClient, {
        team: 'Developer AI',
        label: 'claude',
      });

      expect(result.labelId).toBe('workspace-label');
      expect(result.created).toBe(false);
    });

    it('should handle labels with undefined team', async () => {
      const mockClient = createMockLinearClient({
        teams: jest.fn().mockResolvedValue({
          nodes: [{ id: 'team-123' }],
        }),
        issueLabels: jest
          .fn()
          .mockResolvedValueOnce({ nodes: [] })
          .mockResolvedValueOnce({
            nodes: [
              {
                id: 'workspace-label',
                team: undefined, // undefined (workspace-level)
              },
            ],
          }),
      });

      const result = await ensureLabel(mockClient, {
        team: 'Developer AI',
        label: 'claude',
      });

      expect(result.labelId).toBe('workspace-label');
      expect(result.created).toBe(false);
    });
  });
});
