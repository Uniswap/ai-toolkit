import request from 'supertest';
import type { Express } from 'express';
import express from 'express';
import { WebClient } from '@slack/web-api';
import oauthRouter from '../../src/routes/oauth';

// Mock the Slack WebClient
jest.mock('@slack/web-api');

// Mock the config module
jest.mock('../../src/config', () => ({
  config: {
    slackClientId: 'test-client-id',
    slackClientSecret: 'test-client-secret',
    slackRedirectUri: 'https://example.com/callback',
    slackBotToken: 'xoxb-test-bot-token',
    notionDocUrl: 'https://notion.so/setup-docs',
    environment: 'test',
  },
}));

// Mock the logger to prevent console output during tests
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
  },
}));

describe('OAuth Flow Integration Tests', () => {
  let app: Express;
  let mockOAuthV2Access: jest.Mock;
  let mockConversationsOpen: jest.Mock;
  let mockChatPostMessage: jest.Mock;
  let mockUsersInfo: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Express app
    app = express();
    app.use('/slack/oauth', oauthRouter);
    // Add basic error handler for tests
    app.use((err: any, _req: any, res: any, _next: any) => {
      res.status(err.status || 500).json({ error: err.message });
    });

    // Setup mock implementations
    mockOAuthV2Access = jest.fn();
    mockConversationsOpen = jest.fn();
    mockChatPostMessage = jest.fn();
    mockUsersInfo = jest.fn();

    // Mock WebClient constructor and methods
    (WebClient as jest.MockedClass<typeof WebClient>).mockImplementation(
      (_token?: string) => {
        const client = {
          oauth: {
            v2: {
              access: mockOAuthV2Access,
            },
          },
          conversations: {
            open: mockConversationsOpen,
          },
          chat: {
            postMessage: mockChatPostMessage,
          },
          users: {
            info: mockUsersInfo,
          },
        } as any;
        return client;
      }
    );
  });

  describe('GET /slack/oauth/callback - Success Flow', () => {
    const validState = '1234567890123456789';
    const validCode = 'valid-auth-code';

    const mockTokenResponse = {
      ok: true,
      access_token: 'xoxp-user-token-12345',
      token_type: 'user',
      scope: 'chat:write,users:read',
      team: { id: 'T123456', name: 'Test Team' },
      authed_user: {
        id: 'U123456',
        scope: 'chat:write,users:read',
        access_token: 'xoxp-user-token-12345',
        token_type: 'user',
      },
      bot_user_id: 'B123456',
    };

    const mockUserInfo = {
      ok: true,
      user: {
        id: 'U123456',
        name: 'testuser',
        real_name: 'Test User',
        profile: { email: 'test@example.com' },
        team_id: 'T123456',
        is_bot: false,
        is_admin: false,
        is_owner: false,
      },
    };

    const mockConversationResponse = {
      ok: true,
      channel: { id: 'D123456' },
    };

    const mockMessageResponse = {
      ok: true,
      ts: '1234567890.123456',
    };

    beforeEach(() => {
      mockOAuthV2Access.mockResolvedValue(mockTokenResponse);
      mockUsersInfo.mockResolvedValue(mockUserInfo);
      mockConversationsOpen.mockResolvedValue(mockConversationResponse);
      mockChatPostMessage.mockResolvedValue(mockMessageResponse);
    });

    it('should complete full OAuth flow successfully', async () => {
      const response = await request(app).get('/slack/oauth/callback').query({
        code: validCode,
        state: validState,
      });

      expect(response.status).toBe(200);
      expect(response.text).toContain('Success!');
      expect(response.text).toContain('testuser');

      // Verify OAuth token exchange was called
      expect(mockOAuthV2Access).toHaveBeenCalledWith({
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        code: validCode,
        redirect_uri: 'https://example.com/callback',
      });

      // Verify user info was fetched
      expect(mockUsersInfo).toHaveBeenCalledWith({ user: 'U123456' });

      // Verify DM was sent with token
      expect(mockConversationsOpen).toHaveBeenCalledWith({ users: 'U123456' });
      expect(mockChatPostMessage).toHaveBeenCalledWith({
        channel: 'D123456',
        text: expect.stringContaining('xoxp-user-token-12345'),
        blocks: expect.any(Array),
      });
    });

    it('should handle OAuth flow without user info gracefully', async () => {
      mockOAuthV2Access.mockResolvedValue({
        ...mockTokenResponse,
        authed_user: undefined,
      });

      const response = await request(app).get('/slack/oauth/callback').query({
        code: validCode,
        state: validState,
      });

      expect(response.status).toBe(200);
      expect(response.text).toContain('Success!');

      // Should not attempt to fetch user info or send DM
      expect(mockUsersInfo).not.toHaveBeenCalled();
      expect(mockConversationsOpen).not.toHaveBeenCalled();
      expect(mockChatPostMessage).not.toHaveBeenCalled();
    });

    it('should continue flow even if DM sending fails', async () => {
      mockConversationsOpen.mockRejectedValue(new Error('DM failed'));

      const response = await request(app).get('/slack/oauth/callback').query({
        code: validCode,
        state: validState,
      });

      // Should still return success page
      expect(response.status).toBe(200);
      expect(response.text).toContain('Success!');

      // Token exchange should have been attempted
      expect(mockOAuthV2Access).toHaveBeenCalled();
    });

    it('should handle DM message posting failure gracefully', async () => {
      mockChatPostMessage.mockRejectedValue(new Error('Message post failed'));

      const response = await request(app).get('/slack/oauth/callback').query({
        code: validCode,
        state: validState,
      });

      // Should still return success page
      expect(response.status).toBe(200);
      expect(response.text).toContain('Success!');
    });
  });

  describe('GET /slack/oauth/callback - Error Scenarios', () => {
    it('should handle missing authorization code', async () => {
      const response = await request(app).get('/slack/oauth/callback').query({
        state: '1234567890123456',
      });

      expect(response.status).toBe(400);
      expect(response.text).toContain('Error');
      expect(response.text).toContain('Missing authorization code');
    });

    it('should handle OAuth error from Slack', async () => {
      const response = await request(app).get('/slack/oauth/callback').query({
        error: 'access_denied',
        error_description: 'User denied the authorization request',
        state: '1234567890123456',
      });

      expect(response.status).toBe(400);
      expect(response.text).toContain('Error');
      expect(response.text).toContain('User denied the authorization request');

      // Should not attempt token exchange
      expect(mockOAuthV2Access).not.toHaveBeenCalled();
    });

    it('should reject invalid state parameter', async () => {
      const response = await request(app).get('/slack/oauth/callback').query({
        code: 'valid-code',
        state: 'short', // Invalid state (< 16 chars)
      });

      expect(response.status).toBe(400);
      expect(response.text).toContain('Error');
      expect(response.text).toContain('state');
    });

    it('should handle token exchange failure', async () => {
      mockOAuthV2Access.mockResolvedValue({
        ok: false,
        error: 'invalid_code',
      });

      const response = await request(app).get('/slack/oauth/callback').query({
        code: 'invalid-code',
        state: '1234567890123456',
      });

      expect(response.status).toBe(400);
      expect(response.text).toContain('Error');
    });

    it('should handle network errors during token exchange', async () => {
      mockOAuthV2Access.mockRejectedValue(new Error('Network timeout'));

      const response = await request(app).get('/slack/oauth/callback').query({
        code: 'valid-code',
        state: '1234567890123456',
      });

      expect(response.status).toBe(400);
      expect(response.text).toContain('Error');
    });

    it('should handle missing state parameter', async () => {
      const response = await request(app).get('/slack/oauth/callback').query({
        code: 'valid-code',
      });

      expect(response.status).toBe(400);
      expect(response.text).toContain('Error');
      expect(response.text).toContain('state');
    });
  });

  describe('GET /slack/oauth/authorize', () => {
    it('should generate OAuth URL and redirect', async () => {
      const response = await request(app)
        .get('/slack/oauth/authorize')
        .expect(302);

      expect(response.headers.location).toContain(
        'https://slack.com/oauth/v2/authorize'
      );
      expect(response.headers.location).toContain('client_id=test-client-id');
      expect(response.headers.location).toContain(
        'redirect_uri=https%3A%2F%2Fexample.com%2Fcallback'
      );
      expect(response.headers.location).toContain('state=state_');
    });
  });

  describe('End-to-End Flow Scenarios', () => {
    it('should handle complete flow with all API calls successful', async () => {
      // Setup all successful mocks
      const mockTokenResponse = {
        ok: true,
        access_token: 'xoxp-complete-token',
        token_type: 'user',
        scope: 'chat:write,users:read,users:read.email',
        team: { id: 'T999999', name: 'Complete Team' },
        enterprise: { id: 'E999999', name: 'Complete Enterprise' },
        authed_user: {
          id: 'U999999',
          scope: 'chat:write,users:read,users:read.email',
          access_token: 'xoxp-complete-token',
          token_type: 'user',
        },
        bot_user_id: 'B999999',
      };

      const mockUserInfo = {
        ok: true,
        user: {
          id: 'U999999',
          name: 'completeuser',
          real_name: 'Complete User',
          profile: {
            email: 'complete@example.com',
            display_name: 'Complete',
            image_72: 'https://example.com/avatar.jpg',
          },
          team_id: 'T999999',
          is_bot: false,
          is_admin: true,
          is_owner: false,
          tz: 'America/Los_Angeles',
          tz_label: 'Pacific Standard Time',
          tz_offset: -28800,
        },
      };

      mockOAuthV2Access.mockResolvedValue(mockTokenResponse);
      mockUsersInfo.mockResolvedValue(mockUserInfo);
      mockConversationsOpen.mockResolvedValue({
        ok: true,
        channel: { id: 'D999999' },
      });
      mockChatPostMessage.mockResolvedValue({
        ok: true,
        ts: '9999999999.999999',
      });

      const response = await request(app).get('/slack/oauth/callback').query({
        code: 'complete-auth-code',
        state: 'complete_state_1234567890',
      });

      expect(response.status).toBe(200);
      expect(response.text).toContain('Success!');
      expect(response.text).toContain('completeuser');

      // Verify all API calls were made in correct order
      expect(mockOAuthV2Access).toHaveBeenCalledTimes(1);
      expect(mockUsersInfo).toHaveBeenCalledTimes(1);
      expect(mockConversationsOpen).toHaveBeenCalledTimes(1);
      expect(mockChatPostMessage).toHaveBeenCalledTimes(1);

      // Verify the DM contains the correct token
      expect(mockChatPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('xoxp-complete-token'),
        })
      );
    });

    it('should handle partial failures in non-critical operations', async () => {
      // Token exchange succeeds
      mockOAuthV2Access.mockResolvedValue({
        ok: true,
        access_token: 'xoxp-partial-token',
        authed_user: { id: 'U777777' },
      });

      // User info fails (non-critical)
      mockUsersInfo.mockRejectedValue(new Error('User info failed'));

      // DM operations succeed
      mockConversationsOpen.mockResolvedValue({
        ok: true,
        channel: { id: 'D777777' },
      });
      mockChatPostMessage.mockResolvedValue({
        ok: true,
        ts: '7777777777.777777',
      });

      const response = await request(app).get('/slack/oauth/callback').query({
        code: 'partial-auth-code',
        state: 'partial_state_1234567890',
      });

      // Should still succeed overall
      expect(response.status).toBe(200);
      expect(response.text).toContain('Success!');

      // DM should still be sent even without user info
      expect(mockChatPostMessage).toHaveBeenCalled();
    });
  });

  describe('Error Page Formatting', () => {
    it('should display user-friendly error for invalid_code', async () => {
      const response = await request(app).get('/slack/oauth/callback').query({
        error: 'invalid_code',
      });

      expect(response.status).toBe(400);
      expect(response.text).toContain('Authorization Failed');
      expect(response.text).toContain('Try Again');
    });

    it('should display user-friendly error for state_mismatch', async () => {
      const response = await request(app).get('/slack/oauth/callback').query({
        code: 'valid-code',
        state: 'bad',
      });

      expect(response.status).toBe(400);
      expect(response.text).toContain('Security validation failed');
    });
  });
});
