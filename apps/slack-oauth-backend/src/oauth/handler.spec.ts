import { WebClient } from '@slack/web-api';
import { SlackOAuthHandler, createOAuthHandler } from './handler';
import type { OAuthCallbackParams } from './types';

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

describe('SlackOAuthHandler', () => {
  let handler: SlackOAuthHandler;
  let mockOAuthV2Access: jest.Mock;
  let mockUsersInfo: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations
    mockOAuthV2Access = jest.fn();
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
          users: {
            info: mockUsersInfo,
          },
        } as any;
        return client;
      }
    );

    handler = new SlackOAuthHandler({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'https://example.com/callback',
      scopes: ['chat:write', 'users:read'],
    });
  });

  describe('generateAuthUrl', () => {
    it('should generate a valid Slack OAuth authorization URL', () => {
      const state = 'test-state-123456789';
      const authUrl = handler.generateAuthUrl(state);

      expect(authUrl).toContain('https://slack.com/oauth/v2/authorize');
      expect(authUrl).toContain('client_id=test-client-id');
      expect(authUrl).toContain(
        'redirect_uri=https%3A%2F%2Fexample.com%2Fcallback'
      );
      expect(authUrl).toContain('state=test-state-123456789');
      expect(authUrl).toContain('scope=chat%3Awrite%2Cusers%3Aread');
    });
  });

  describe('validateState', () => {
    it('should validate state with minimum length requirement', () => {
      expect(handler.validateState('1234567890123456')).toBe(true); // 16 chars
      expect(handler.validateState('12345678901234567890')).toBe(true); // 20 chars
    });

    it('should reject invalid state', () => {
      expect(handler.validateState(undefined)).toBe(false);
      expect(handler.validateState('')).toBe(false);
      expect(handler.validateState('short')).toBe(false); // < 16 chars
    });

    it('should use custom validation function if provided', () => {
      const customValidate = jest.fn().mockReturnValue(true);
      const customHandler = new SlackOAuthHandler({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'https://example.com/callback',
        validateState: customValidate,
      });

      const state = 'custom-state';
      const result = customHandler.validateState(state);

      expect(customValidate).toHaveBeenCalledWith(state);
      expect(result).toBe(true);
    });
  });

  describe('handleCallback', () => {
    describe('with valid authorization code', () => {
      const validParams: OAuthCallbackParams = {
        code: 'valid-auth-code',
        state: '1234567890123456',
      };

      const mockTokenResponse = {
        ok: true,
        access_token: 'xoxp-user-token',
        token_type: 'user',
        scope: 'chat:write,users:read',
        team: { id: 'T123456', name: 'Test Team' },
        authed_user: {
          id: 'U123456',
          scope: 'chat:write,users:read',
          access_token: 'xoxp-user-token',
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
          tz: 'America/New_York',
          tz_label: 'Eastern Standard Time',
          tz_offset: -18000,
        },
      };

      beforeEach(() => {
        mockOAuthV2Access.mockResolvedValue(mockTokenResponse);
        mockUsersInfo.mockResolvedValue(mockUserInfo);
      });

      it('should successfully exchange code for token', async () => {
        const result = await handler.handleCallback(validParams);

        expect(result.success).toBe(true);
        expect(result.accessToken).toBe('xoxp-user-token');
        expect(result.user).toEqual({
          id: 'U123456',
          name: 'testuser',
          real_name: 'Test User',
          email: 'test@example.com',
          team_id: 'T123456',
          is_bot: false,
          is_admin: false,
          is_owner: false,
          tz: 'America/New_York',
          tz_label: 'Eastern Standard Time',
          tz_offset: -18000,
        });
        expect(result.details).toEqual({
          team: { id: 'T123456', name: 'Test Team' },
          enterprise: undefined,
          scopes: 'chat:write,users:read',
          bot_user_id: 'B123456',
        });
      });

      it('should call Slack API with correct parameters', async () => {
        await handler.handleCallback(validParams);

        expect(mockOAuthV2Access).toHaveBeenCalledWith({
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
          code: 'valid-auth-code',
          redirect_uri: 'https://example.com/callback',
        });

        expect(mockUsersInfo).toHaveBeenCalledWith({ user: 'U123456' });
      });

      it('should handle successful token exchange without user info', async () => {
        const responseWithoutUser = {
          ...mockTokenResponse,
          authed_user: undefined,
        };
        mockOAuthV2Access.mockResolvedValue(responseWithoutUser);

        const result = await handler.handleCallback(validParams);

        expect(result.success).toBe(true);
        expect(result.accessToken).toBe('xoxp-user-token');
        expect(result.user).toBeUndefined();
        expect(mockUsersInfo).not.toHaveBeenCalled();
      });

      it('should handle user info fetch failure gracefully', async () => {
        mockUsersInfo.mockRejectedValue(new Error('User fetch failed'));

        const result = await handler.handleCallback(validParams);

        expect(result.success).toBe(true);
        expect(result.accessToken).toBe('xoxp-user-token');
        expect(result.user).toBeUndefined();
      });
    });

    describe('with invalid authorization code', () => {
      it('should handle missing authorization code', async () => {
        const params: OAuthCallbackParams = {
          state: '1234567890123456',
        };

        const result = await handler.handleCallback(params);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Missing authorization code');
        expect(result.errorCode).toBe('invalid_code');
      });

      it('should handle OAuth error from Slack', async () => {
        const params: OAuthCallbackParams = {
          error: 'access_denied',
          error_description: 'User denied the authorization request',
          state: '1234567890123456',
        };

        const result = await handler.handleCallback(params);

        expect(result.success).toBe(false);
        expect(result.error).toBe('User denied the authorization request');
        expect(result.errorCode).toBe('invalid_code');
        expect(result.details).toEqual({
          error: 'access_denied',
          description: 'User denied the authorization request',
        });
      });

      it('should handle token exchange failure', async () => {
        const params: OAuthCallbackParams = {
          code: 'invalid-code',
          state: '1234567890123456',
        };

        mockOAuthV2Access.mockResolvedValue({
          ok: false,
          error: 'invalid_code',
        });

        const result = await handler.handleCallback(params);

        expect(result.success).toBe(false);
        expect(result.error).toBe('invalid_code');
        expect(result.errorCode).toBe('token_exchange_failed');
      });

      it('should handle network errors during token exchange', async () => {
        const params: OAuthCallbackParams = {
          code: 'valid-code',
          state: '1234567890123456',
        };

        mockOAuthV2Access.mockRejectedValue(new Error('Network error'));

        const result = await handler.handleCallback(params);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Token exchange failed: Network error');
        expect(result.errorCode).toBe('token_exchange_failed');
      });
    });

    describe('state validation and CSRF protection', () => {
      it('should reject invalid state parameter', async () => {
        const params: OAuthCallbackParams = {
          code: 'valid-code',
          state: 'short', // Invalid state (< 16 chars)
        };

        const result = await handler.handleCallback(params);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid or missing state parameter');
        expect(result.errorCode).toBe('state_mismatch');
        expect(result.details).toEqual({ providedState: 'short' });
      });

      it('should reject missing state parameter', async () => {
        const params: OAuthCallbackParams = {
          code: 'valid-code',
        };

        const result = await handler.handleCallback(params);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid or missing state parameter');
        expect(result.errorCode).toBe('state_mismatch');
      });

      it('should use custom state validation', async () => {
        const customValidate = jest.fn().mockReturnValue(false);
        const customHandler = new SlackOAuthHandler({
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'https://example.com/callback',
          validateState: customValidate,
        });

        const params: OAuthCallbackParams = {
          code: 'valid-code',
          state: 'custom-state',
        };

        const result = await customHandler.handleCallback(params);

        expect(customValidate).toHaveBeenCalledWith('custom-state');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('state_mismatch');
      });
    });
  });

  describe('createOAuthHandler', () => {
    it('should create handler with config values', () => {
      const handler = createOAuthHandler();

      // Verify handler is created (can't directly test private properties)
      expect(handler).toBeInstanceOf(SlackOAuthHandler);
      expect(handler.validateState).toBeDefined();
      expect(handler.generateAuthUrl).toBeDefined();
      expect(handler.handleCallback).toBeDefined();
    });

    it('should create handler with custom state validation', () => {
      const customValidate = jest.fn().mockReturnValue(true);
      const handler = createOAuthHandler(customValidate);

      handler.validateState('test-state');

      expect(customValidate).toHaveBeenCalledWith('test-state');
    });
  });
});
