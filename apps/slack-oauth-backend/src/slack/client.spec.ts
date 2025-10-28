import { WebClient } from '@slack/web-api';
import {
  SlackClient,
  SlackApiError,
  createSlackClient,
  clearSlackCaches,
} from './client';

// Mock the Slack WebClient
jest.mock('@slack/web-api');

// Mock the config module
jest.mock('../config', () => ({
  config: {
    slackClientId: 'test-client-id',
    slackClientSecret: 'test-client-secret',
    slackRedirectUri: 'https://example.com/callback',
    slackBotToken: 'xoxb-test-bot-token',
  },
}));

describe('SlackClient', () => {
  let client: SlackClient;
  let mockOAuthV2Access: jest.Mock;
  let mockConversationsOpen: jest.Mock;
  let mockChatPostMessage: jest.Mock;
  let mockUsersInfo: jest.Mock;
  let mockAuthTest: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Clear Slack caches to prevent test interference
    clearSlackCaches();

    // Setup mock implementations
    mockOAuthV2Access = jest.fn();
    mockConversationsOpen = jest.fn();
    mockChatPostMessage = jest.fn();
    mockUsersInfo = jest.fn();
    mockAuthTest = jest.fn();

    // Mock WebClient constructor and methods
    (WebClient as jest.MockedClass<typeof WebClient>).mockImplementation(
      (_token?: string) => {
        const webClient = {
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
          auth: {
            test: mockAuthTest,
          },
        } as any;
        return webClient;
      }
    );

    client = new SlackClient();
  });

  describe('constructor', () => {
    it('should create two WebClient instances with proper configuration', () => {
      expect(WebClient).toHaveBeenCalledTimes(2);

      // First call for oauth client (no token)
      expect(WebClient).toHaveBeenNthCalledWith(
        1,
        undefined,
        expect.objectContaining({
          retryConfig: {
            retries: 3,
            factor: 2,
            maxRetryTime: 30000,
          },
          timeout: 10000,
        })
      );

      // Second call for bot client (with bot token)
      expect(WebClient).toHaveBeenNthCalledWith(
        2,
        'xoxb-test-bot-token',
        expect.objectContaining({
          retryConfig: {
            retries: 3,
            factor: 2,
            maxRetryTime: 30000,
          },
          timeout: 10000,
        })
      );
    });

    it('should accept an optional token parameter', () => {
      const customToken = 'xoxp-user-token';
      new SlackClient(customToken);

      // beforeEach creates a client (calls 1-2), then this test creates another (calls 3-4)
      // Check that calls 3-4 used the custom token and bot token
      expect(WebClient).toHaveBeenNthCalledWith(
        3,
        customToken,
        expect.any(Object)
      );
      expect(WebClient).toHaveBeenNthCalledWith(
        4,
        'xoxb-test-bot-token',
        expect.any(Object)
      );
    });
  });

  describe('exchangeCode', () => {
    const mockSuccessResponse = {
      ok: true,
      access_token: 'xoxp-user-token',
      scope: 'chat:write,users:read',
      team: { id: 'T123456', name: 'Test Team' },
      authed_user: { id: 'U123456' },
      bot_user_id: 'B123456',
    };

    it('should successfully exchange authorization code for token', async () => {
      mockOAuthV2Access.mockResolvedValue(mockSuccessResponse);

      const result = await client.exchangeCode('valid-auth-code');

      expect(result).toEqual({
        success: true,
        accessToken: 'xoxp-user-token',
        scope: 'chat:write,users:read',
        teamId: 'T123456',
        teamName: 'Test Team',
        userId: 'U123456',
        botUserId: 'B123456',
      });

      expect(mockOAuthV2Access).toHaveBeenCalledWith({
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        code: 'valid-auth-code',
        redirect_uri: 'https://example.com/callback',
      });
    });

    it('should handle failed token exchange', async () => {
      mockOAuthV2Access.mockResolvedValue({
        ok: false,
        error: 'invalid_code',
      });

      await expect(client.exchangeCode('invalid-code')).rejects.toThrow(
        SlackApiError
      );
      await expect(client.exchangeCode('invalid-code')).rejects.toMatchObject({
        message: 'invalid_code',
        code: 'EXCHANGE_FAILED',
      });
    });

    it('should handle network errors during token exchange', async () => {
      mockOAuthV2Access.mockRejectedValue(new Error('Network error'));

      await expect(client.exchangeCode('valid-code')).rejects.toThrow(
        SlackApiError
      );
      await expect(client.exchangeCode('valid-code')).rejects.toMatchObject({
        message: 'Failed to exchange authorization code',
        code: 'EXCHANGE_ERROR',
      });
    });

    it('should handle missing response fields gracefully', async () => {
      mockOAuthV2Access.mockResolvedValue({
        ok: true,
        access_token: 'xoxp-user-token',
        scope: 'chat:write',
      });

      const result = await client.exchangeCode('valid-code');

      expect(result).toEqual({
        success: true,
        accessToken: 'xoxp-user-token',
        scope: 'chat:write',
        teamId: undefined,
        teamName: undefined,
        userId: undefined,
        botUserId: undefined,
      });
    });
  });

  describe('sendDirectMessage', () => {
    const mockConversationOpenResponse = {
      ok: true,
      channel: { id: 'D123456' },
    };

    const mockPostMessageResponse = {
      ok: true,
      ts: '1234567890.123456',
    };

    beforeEach(() => {
      mockConversationsOpen.mockResolvedValue(mockConversationOpenResponse);
      mockChatPostMessage.mockResolvedValue(mockPostMessageResponse);
    });

    it('should successfully send a direct message', async () => {
      const userId = 'U123456';
      const message = 'Test message';
      const blocks = [
        { type: 'section', text: { type: 'mrkdwn', text: message } },
      ];

      const result = await client.sendDirectMessage(userId, message, blocks);

      expect(result).toEqual({
        success: true,
        channelId: 'D123456',
        messageTs: '1234567890.123456',
      });

      expect(mockConversationsOpen).toHaveBeenCalledWith({ users: userId });
      expect(mockChatPostMessage).toHaveBeenCalledWith({
        channel: 'D123456',
        text: message,
        blocks: blocks,
      });
    });

    it('should send message without blocks', async () => {
      const userId = 'U123456';
      const message = 'Simple text message';

      const result = await client.sendDirectMessage(userId, message);

      expect(result.success).toBe(true);
      expect(mockChatPostMessage).toHaveBeenCalledWith({
        channel: 'D123456',
        text: message,
        blocks: undefined,
      });
    });

    it('should handle failure to open DM channel', async () => {
      mockConversationsOpen.mockResolvedValue({
        ok: false,
        error: 'user_not_found',
      });

      await expect(client.sendDirectMessage('U999999', 'Test')).rejects.toThrow(
        SlackApiError
      );
      await expect(
        client.sendDirectMessage('U999999', 'Test')
      ).rejects.toMatchObject({
        message: 'Failed to open direct message channel',
        code: 'OPEN_DM_FAILED',
      });
    });

    it('should handle failure to send message', async () => {
      mockChatPostMessage.mockResolvedValue({
        ok: false,
        error: 'channel_not_found',
      });

      await expect(client.sendDirectMessage('U123456', 'Test')).rejects.toThrow(
        SlackApiError
      );
      await expect(
        client.sendDirectMessage('U123456', 'Test')
      ).rejects.toMatchObject({
        message: 'channel_not_found',
        code: 'SEND_MESSAGE_FAILED',
      });
    });

    it('should handle network errors when opening conversation', async () => {
      mockConversationsOpen.mockRejectedValue(new Error('Network timeout'));

      await expect(client.sendDirectMessage('U123456', 'Test')).rejects.toThrow(
        SlackApiError
      );
      await expect(
        client.sendDirectMessage('U123456', 'Test')
      ).rejects.toMatchObject({
        message: 'Failed to send direct message',
        code: 'DM_ERROR',
      });
    });

    it('should handle network errors when sending message', async () => {
      mockChatPostMessage.mockRejectedValue(new Error('Network timeout'));

      await expect(client.sendDirectMessage('U123456', 'Test')).rejects.toThrow(
        SlackApiError
      );
      await expect(
        client.sendDirectMessage('U123456', 'Test')
      ).rejects.toMatchObject({
        message: 'Failed to send direct message',
        code: 'DM_ERROR',
      });
    });
  });

  describe('getUserInfo', () => {
    const mockUserResponse = {
      ok: true,
      user: {
        id: 'U123456',
        name: 'testuser',
        real_name: 'Test User',
        profile: {
          display_name: 'Test',
          email: 'test@example.com',
          image_72: 'https://example.com/avatar.jpg',
        },
        team_id: 'T123456',
        is_bot: false,
        is_admin: true,
        tz: 'America/New_York',
        tz_label: 'Eastern Standard Time',
      },
    };

    it('should successfully get user information', async () => {
      mockUsersInfo.mockResolvedValue(mockUserResponse);

      const result = await client.getUserInfo('U123456');

      expect(result).toEqual({
        id: 'U123456',
        name: 'testuser',
        realName: 'Test User',
        displayName: 'Test',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        teamId: 'T123456',
        isBot: false,
        isAdmin: true,
        timezone: 'America/New_York',
        timezoneLabel: 'Eastern Standard Time',
      });

      expect(mockUsersInfo).toHaveBeenCalledWith({ user: 'U123456' });
    });

    it('should use name as displayName when display_name is not available', async () => {
      const responseWithoutDisplayName = {
        ok: true,
        user: {
          ...mockUserResponse.user,
          profile: { email: 'test@example.com' },
        },
      };

      mockUsersInfo.mockResolvedValue(responseWithoutDisplayName);

      const result = await client.getUserInfo('U123456');

      expect(result.displayName).toBe('testuser');
    });

    it('should handle user not found error', async () => {
      mockUsersInfo.mockResolvedValue({
        ok: false,
        error: 'user_not_found',
      });

      await expect(client.getUserInfo('U999999')).rejects.toThrow(
        SlackApiError
      );
      await expect(client.getUserInfo('U999999')).rejects.toMatchObject({
        message: 'Failed to get user information',
        code: 'USER_INFO_FAILED',
      });
    });

    it('should handle network errors', async () => {
      mockUsersInfo.mockRejectedValue(new Error('Network error'));

      await expect(client.getUserInfo('U123456')).rejects.toThrow(
        SlackApiError
      );
      await expect(client.getUserInfo('U123456')).rejects.toMatchObject({
        message: 'Failed to get user information',
        code: 'USER_INFO_ERROR',
      });
    });
  });

  describe('testAuth', () => {
    const mockAuthResponse = {
      ok: true,
      team_id: 'T123456',
      team: 'Test Team',
      user_id: 'U123456',
      user: 'testbot',
      bot_id: 'B123456',
    };

    it('should successfully test authentication', async () => {
      mockAuthTest.mockResolvedValue(mockAuthResponse);

      const result = await client.testAuth();

      expect(result).toEqual({
        success: true,
        teamId: 'T123456',
        teamName: 'Test Team',
        userId: 'U123456',
        userName: 'testbot',
        botId: 'B123456',
      });

      expect(mockAuthTest).toHaveBeenCalled();
    });

    it('should handle authentication test failure', async () => {
      mockAuthTest.mockResolvedValue({
        ok: false,
        error: 'invalid_auth',
      });

      await expect(client.testAuth()).rejects.toThrow(SlackApiError);
      await expect(client.testAuth()).rejects.toMatchObject({
        message: 'Authentication test failed',
        code: 'AUTH_TEST_FAILED',
      });
    });

    it('should handle network errors during auth test', async () => {
      mockAuthTest.mockRejectedValue(new Error('Network timeout'));

      await expect(client.testAuth()).rejects.toThrow(SlackApiError);
      await expect(client.testAuth()).rejects.toMatchObject({
        message: 'Failed to test authentication',
        code: 'AUTH_TEST_ERROR',
      });
    });
  });

  describe('SlackApiError', () => {
    it('should create error with proper properties', () => {
      const error = new SlackApiError('Test error', 'TEST_CODE', {
        detail: 'test',
      });

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('SlackApiError');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ detail: 'test' });
    });
  });

  describe('createSlackClient', () => {
    it('should create a SlackClient instance without token', () => {
      const client = createSlackClient();

      expect(client).toBeInstanceOf(SlackClient);
      expect(WebClient).toHaveBeenCalledWith(undefined, expect.any(Object));
    });

    it('should create a SlackClient instance with token', () => {
      const client = createSlackClient('xoxp-user-token');

      expect(client).toBeInstanceOf(SlackClient);
      // beforeEach creates a client (calls 1-2), then this test creates another (calls 3-4)
      expect(WebClient).toHaveBeenNthCalledWith(
        3,
        'xoxp-user-token',
        expect.any(Object)
      );
      expect(WebClient).toHaveBeenNthCalledWith(
        4,
        'xoxb-test-bot-token',
        expect.any(Object)
      );
    });
  });

  describe('retry and timeout configuration', () => {
    it('should configure WebClient with retry settings', () => {
      new SlackClient();

      // Verify both WebClient instances were created with retry config
      const expectedConfig = {
        retryConfig: {
          retries: 3,
          factor: 2,
          maxRetryTime: 30000,
        },
        timeout: 10000,
      };

      expect(WebClient).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining(expectedConfig)
      );
      expect(WebClient).toHaveBeenCalledWith(
        'xoxb-test-bot-token',
        expect.objectContaining(expectedConfig)
      );
    });
  });
});
