import type { LinearClient } from '@linear/sdk';
import { updateIssue, parseUpdateIssueConfig } from './update-issue';

describe('update-issue.ts', () => {
  describe('parseUpdateIssueConfig', () => {
    it('should throw error when issue-id is not provided', () => {
      expect(() =>
        parseUpdateIssueConfig({
          status: 'In Review',
        })
      ).toThrow('--issue-id is required');
    });

    it('should throw error when status is not provided', () => {
      expect(() =>
        parseUpdateIssueConfig({
          issueId: 'issue-123',
        })
      ).toThrow('--status is required');
    });

    it('should parse issueId from camelCase argument', () => {
      const config = parseUpdateIssueConfig({
        issueId: 'issue-123',
        status: 'In Review',
      });

      expect(config.issueId).toBe('issue-123');
    });

    it('should parse issueId from kebab-case argument', () => {
      const config = parseUpdateIssueConfig({
        'issue-id': 'issue-456',
        status: 'In Review',
      });

      expect(config.issueId).toBe('issue-456');
    });

    it('should prefer camelCase issueId over kebab-case', () => {
      const config = parseUpdateIssueConfig({
        issueId: 'camel-id',
        'issue-id': 'kebab-id',
        status: 'In Review',
      });

      expect(config.issueId).toBe('camel-id');
    });

    it('should parse status', () => {
      const config = parseUpdateIssueConfig({
        issueId: 'issue-123',
        status: 'In Review',
      });

      expect(config.status).toBe('In Review');
    });

    it('should parse prUrl from camelCase argument', () => {
      const config = parseUpdateIssueConfig({
        issueId: 'issue-123',
        status: 'In Review',
        prUrl: 'https://github.com/org/repo/pull/123',
      });

      expect(config.prUrl).toBe('https://github.com/org/repo/pull/123');
    });

    it('should parse prUrl from kebab-case argument', () => {
      const config = parseUpdateIssueConfig({
        issueId: 'issue-123',
        status: 'In Review',
        'pr-url': 'https://github.com/org/repo/pull/456',
      });

      expect(config.prUrl).toBe('https://github.com/org/repo/pull/456');
    });

    it('should prefer camelCase prUrl over kebab-case', () => {
      const config = parseUpdateIssueConfig({
        issueId: 'issue-123',
        status: 'In Review',
        prUrl: 'https://camel.com/pull/1',
        'pr-url': 'https://kebab.com/pull/2',
      });

      expect(config.prUrl).toBe('https://camel.com/pull/1');
    });

    it('should parse optional comment', () => {
      const config = parseUpdateIssueConfig({
        issueId: 'issue-123',
        status: 'In Review',
        comment: 'PR created by Claude',
      });

      expect(config.comment).toBe('PR created by Claude');
    });

    it('should accept all options together', () => {
      const config = parseUpdateIssueConfig({
        issueId: 'issue-123',
        status: 'Done',
        prUrl: 'https://github.com/org/repo/pull/99',
        comment: 'Completed successfully',
      });

      expect(config).toEqual({
        issueId: 'issue-123',
        status: 'Done',
        prUrl: 'https://github.com/org/repo/pull/99',
        comment: 'Completed successfully',
      });
    });

    it('should allow prUrl to be undefined', () => {
      const config = parseUpdateIssueConfig({
        issueId: 'issue-123',
        status: 'In Review',
      });

      expect(config.prUrl).toBeUndefined();
    });

    it('should allow comment to be undefined', () => {
      const config = parseUpdateIssueConfig({
        issueId: 'issue-123',
        status: 'In Review',
      });

      expect(config.comment).toBeUndefined();
    });
  });

  describe('updateIssue', () => {
    const createMockLinearClient = (overrides: Partial<LinearClient> = {}) =>
      ({
        issue: jest.fn(),
        updateIssue: jest.fn(),
        createAttachment: jest.fn(),
        createComment: jest.fn(),
        ...overrides,
      }) as unknown as LinearClient;

    const createMockIssue = (overrides = {}) => ({
      id: 'issue-123',
      team: Promise.resolve({
        name: 'Developer AI',
        states: jest.fn().mockResolvedValue({
          nodes: [
            { id: 'state-backlog', name: 'Backlog' },
            { id: 'state-in-review', name: 'In Review' },
            { id: 'state-done', name: 'Done' },
          ],
        }),
      }),
      ...overrides,
    });

    it('should throw error when issue is not found', async () => {
      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue(null),
      });

      await expect(
        updateIssue(mockClient, {
          issueId: 'non-existent',
          status: 'In Review',
        })
      ).rejects.toThrow('Issue "non-existent" not found');
    });

    it('should throw error when team is not found', async () => {
      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue({
          id: 'issue-123',
          team: Promise.resolve(null),
        }),
      });

      await expect(
        updateIssue(mockClient, {
          issueId: 'issue-123',
          status: 'In Review',
        })
      ).rejects.toThrow('Could not find team for issue "issue-123"');
    });

    it('should throw error when workflow state is not found', async () => {
      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue({
          id: 'issue-123',
          team: Promise.resolve({
            name: 'Developer AI',
            states: jest.fn().mockResolvedValue({
              nodes: [
                { id: 'state-1', name: 'Backlog' },
                { id: 'state-2', name: 'Done' },
              ],
            }),
          }),
        }),
      });

      await expect(
        updateIssue(mockClient, {
          issueId: 'issue-123',
          status: 'Non-existent Status',
        })
      ).rejects.toThrow(
        'Workflow state "Non-existent Status" not found in team "Developer AI". Available states: Backlog, Done'
      );
    });

    it('should update issue status successfully', async () => {
      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue(createMockIssue()),
        updateIssue: jest.fn().mockResolvedValue({ success: true }),
      });

      const result = await updateIssue(mockClient, {
        issueId: 'issue-123',
        status: 'In Review',
      });

      expect(result.success).toBe(true);
      expect(result.statusUpdated).toBe(true);
      expect(result.attachmentAdded).toBe(false);
      expect(mockClient.updateIssue).toHaveBeenCalledWith('issue-123', {
        stateId: 'state-in-review',
      });
    });

    it('should throw error when status update fails', async () => {
      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue(createMockIssue()),
        updateIssue: jest.fn().mockResolvedValue({ success: false }),
      });

      await expect(
        updateIssue(mockClient, {
          issueId: 'issue-123',
          status: 'In Review',
        })
      ).rejects.toThrow('Failed to update issue "issue-123" status to "In Review"');
    });

    it('should add PR attachment when prUrl is provided', async () => {
      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue(createMockIssue()),
        updateIssue: jest.fn().mockResolvedValue({ success: true }),
        createAttachment: jest.fn().mockResolvedValue({ success: true }),
      });

      const result = await updateIssue(mockClient, {
        issueId: 'issue-123',
        status: 'In Review',
        prUrl: 'https://github.com/org/repo/pull/456',
      });

      expect(result.attachmentAdded).toBe(true);
      expect(mockClient.createAttachment).toHaveBeenCalledWith({
        issueId: 'issue-123',
        url: 'https://github.com/org/repo/pull/456',
        title: 'PR #456',
        subtitle: 'Created by Claude Code',
        iconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
      });
    });

    it('should extract PR number from GitHub URL for attachment title', async () => {
      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue(createMockIssue()),
        updateIssue: jest.fn().mockResolvedValue({ success: true }),
        createAttachment: jest.fn().mockResolvedValue({ success: true }),
      });

      await updateIssue(mockClient, {
        issueId: 'issue-123',
        status: 'In Review',
        prUrl: 'https://github.com/my-org/my-repo/pull/789',
      });

      expect(mockClient.createAttachment).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'PR #789',
        })
      );
    });

    it('should use generic title for non-GitHub PR URLs', async () => {
      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue(createMockIssue()),
        updateIssue: jest.fn().mockResolvedValue({ success: true }),
        createAttachment: jest.fn().mockResolvedValue({ success: true }),
      });

      await updateIssue(mockClient, {
        issueId: 'issue-123',
        status: 'In Review',
        prUrl: 'https://gitlab.com/org/repo/merge_requests/123',
      });

      expect(mockClient.createAttachment).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Pull Request',
        })
      );
    });

    it('should not fail when attachment creation fails', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue(createMockIssue()),
        updateIssue: jest.fn().mockResolvedValue({ success: true }),
        createAttachment: jest.fn().mockResolvedValue({ success: false }),
      });

      const result = await updateIssue(mockClient, {
        issueId: 'issue-123',
        status: 'In Review',
        prUrl: 'https://github.com/org/repo/pull/456',
      });

      expect(result.success).toBe(true);
      expect(result.attachmentAdded).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Warning: Failed to attach PR URL to issue "issue-123"'
      );

      consoleSpy.mockRestore();
    });

    it('should add comment when provided', async () => {
      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue(createMockIssue()),
        updateIssue: jest.fn().mockResolvedValue({ success: true }),
        createComment: jest.fn().mockResolvedValue({ success: true }),
      });

      await updateIssue(mockClient, {
        issueId: 'issue-123',
        status: 'In Review',
        comment: 'PR created automatically by Claude Code',
      });

      expect(mockClient.createComment).toHaveBeenCalledWith({
        issueId: 'issue-123',
        body: 'PR created automatically by Claude Code',
      });
    });

    it('should not fail when comment creation fails with unsuccessful response', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue(createMockIssue()),
        updateIssue: jest.fn().mockResolvedValue({ success: true }),
        createComment: jest.fn().mockResolvedValue({ success: false }),
      });

      const result = await updateIssue(mockClient, {
        issueId: 'issue-123',
        status: 'In Review',
        comment: 'Test comment',
      });

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Warning: Failed to add comment to issue "issue-123"'
      );

      consoleSpy.mockRestore();
    });

    it('should not fail when comment creation throws error', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue(createMockIssue()),
        updateIssue: jest.fn().mockResolvedValue({ success: true }),
        createComment: jest.fn().mockRejectedValue(new Error('Network error')),
      });

      const result = await updateIssue(mockClient, {
        issueId: 'issue-123',
        status: 'In Review',
        comment: 'Test comment',
      });

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Warning: Failed to add comment: Network error');

      consoleSpy.mockRestore();
    });

    it('should handle non-Error thrown objects in comment creation', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue(createMockIssue()),
        updateIssue: jest.fn().mockResolvedValue({ success: true }),
        createComment: jest.fn().mockRejectedValue('String error'),
      });

      const result = await updateIssue(mockClient, {
        issueId: 'issue-123',
        status: 'In Review',
        comment: 'Test comment',
      });

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Warning: Failed to add comment: String error');

      consoleSpy.mockRestore();
    });

    it('should perform all operations together', async () => {
      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue(createMockIssue()),
        updateIssue: jest.fn().mockResolvedValue({ success: true }),
        createAttachment: jest.fn().mockResolvedValue({ success: true }),
        createComment: jest.fn().mockResolvedValue({ success: true }),
      });

      const result = await updateIssue(mockClient, {
        issueId: 'issue-123',
        status: 'Done',
        prUrl: 'https://github.com/org/repo/pull/100',
        comment: 'Task completed successfully!',
      });

      expect(result).toEqual({
        success: true,
        statusUpdated: true,
        attachmentAdded: true,
      });
      expect(mockClient.updateIssue).toHaveBeenCalled();
      expect(mockClient.createAttachment).toHaveBeenCalled();
      expect(mockClient.createComment).toHaveBeenCalled();
    });

    it('should not call createAttachment when prUrl is not provided', async () => {
      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue(createMockIssue()),
        updateIssue: jest.fn().mockResolvedValue({ success: true }),
        createAttachment: jest.fn(),
      });

      await updateIssue(mockClient, {
        issueId: 'issue-123',
        status: 'In Review',
      });

      expect(mockClient.createAttachment).not.toHaveBeenCalled();
    });

    it('should not call createComment when comment is not provided', async () => {
      const mockClient = createMockLinearClient({
        issue: jest.fn().mockResolvedValue(createMockIssue()),
        updateIssue: jest.fn().mockResolvedValue({ success: true }),
        createComment: jest.fn(),
      });

      await updateIssue(mockClient, {
        issueId: 'issue-123',
        status: 'In Review',
      });

      expect(mockClient.createComment).not.toHaveBeenCalled();
    });
  });
});
