import type { WebClientOptions } from '@slack/web-api';
import { WebClient } from '@slack/web-api';
import { Agent } from 'https';
import { config } from '../config';
import { userInfoCache, channelCache } from '../utils/cache';
import { logger } from '../utils/logger';

// Create a shared HTTPS agent with connection pooling
const httpsAgent = new Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 10, // Maximum concurrent connections per host
  maxFreeSockets: 5, // Maximum idle connections per host
});

/**
 * Slack API Client wrapper with enhanced functionality and caching
 */
export class SlackClient {
  private readonly client: WebClient;
  private readonly botClient: WebClient;
  private static instance?: SlackClient;

  constructor(token?: string) {
    // Configure client options with retry, timeout, and connection pooling
    const clientOptions: WebClientOptions = {
      retryConfig: {
        retries: 3,
        factor: 2,
        maxRetryTime: 30000, // 30 seconds
      },
      timeout: 10000, // 10 second timeout for requests
      agent: httpsAgent, // Use connection pooling
    };

    // Client for OAuth operations (no token needed)
    this.client = new WebClient(token, clientOptions);

    // Bot client for sending messages
    this.botClient = new WebClient(config.slackBotToken, clientOptions);
  }

  /**
   * Get singleton instance for better connection reuse
   */
  static getInstance(token?: string): SlackClient {
    if (!SlackClient.instance) {
      SlackClient.instance = new SlackClient(token);
    }
    return SlackClient.instance;
  }

  /**
   * Exchange authorization code for access token
   * This is now handled in the OAuth handler, but kept here for direct usage if needed
   */
  async exchangeCode(code: string): Promise<ExchangeCodeResponse> {
    try {
      const response = await this.client.oauth.v2.access({
        client_id: config.slackClientId,
        client_secret: config.slackClientSecret,
        code: code,
        redirect_uri: config.slackRedirectUri,
      });

      if (!response.ok) {
        throw new SlackApiError(
          response.error || 'Failed to exchange code',
          'EXCHANGE_FAILED',
          response
        );
      }

      return {
        success: true,
        accessToken: response.access_token as string,
        scope: response.scope as string,
        teamId: (response.team as any)?.id,
        teamName: (response.team as any)?.name,
        userId: (response.authed_user as any)?.id,
        botUserId: response.bot_user_id as string,
      };
    } catch (error) {
      if (error instanceof SlackApiError) {
        throw error;
      }

      throw new SlackApiError(
        'Failed to exchange authorization code',
        'EXCHANGE_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Send a direct message to a user with channel caching
   */
  async sendDirectMessage(
    userId: string,
    message: string,
    blocks?: any[]
  ): Promise<SendMessageResponse> {
    try {
      // Check cache for existing channel
      const cacheKey = `dm_channel:${userId}`;
      let channelId = channelCache.get(cacheKey);

      if (!channelId) {
        // Open a conversation with the user
        const conversationResponse = await this.botClient.conversations.open({
          users: userId,
        });

        if (!conversationResponse.ok || !conversationResponse.channel) {
          throw new SlackApiError(
            'Failed to open direct message channel',
            'OPEN_DM_FAILED',
            conversationResponse
          );
        }

        channelId = (conversationResponse.channel as any).id;

        // Cache the channel ID
        channelCache.set(cacheKey, channelId);
        logger.debug('Cached DM channel', { userId, channelId });
      }

      // Send the message
      const messageResponse = await this.botClient.chat.postMessage({
        channel: channelId,
        text: message,
        blocks: blocks,
      });

      if (!messageResponse.ok) {
        throw new SlackApiError(
          messageResponse.error || 'Failed to send message',
          'SEND_MESSAGE_FAILED',
          messageResponse
        );
      }

      return {
        success: true,
        channelId: channelId,
        messageTs: messageResponse.ts as string,
      };
    } catch (error) {
      if (error instanceof SlackApiError) {
        throw error;
      }

      throw new SlackApiError('Failed to send direct message', 'DM_ERROR', {
        originalError: error,
      });
    }
  }

  /**
   * Get user information with caching
   */
  async getUserInfo(userId: string): Promise<UserInfoResponse> {
    const cacheKey = `user:${userId}`;

    // Use cache's getOrSet for automatic cache management
    return await userInfoCache.getOrSet(cacheKey, async () => {
      try {
        const response = await this.botClient.users.info({
          user: userId,
        });

        if (!response.ok || !response.user) {
          throw new SlackApiError(
            'Failed to get user information',
            'USER_INFO_FAILED',
            response
          );
        }

        const user = response.user as any;

        const userInfo: UserInfoResponse = {
          id: user.id,
          name: user.name,
          realName: user.real_name,
          displayName: user.profile?.display_name || user.name,
          email: user.profile?.email,
          image: user.profile?.image_72,
          teamId: user.team_id,
          isBot: user.is_bot || false,
          isAdmin: user.is_admin || false,
          timezone: user.tz,
          timezoneLabel: user.tz_label,
        };

        logger.debug('Fetched and cached user info', { userId });
        return userInfo;
      } catch (error) {
        if (error instanceof SlackApiError) {
          throw error;
        }

        throw new SlackApiError(
          'Failed to get user information',
          'USER_INFO_ERROR',
          { originalError: error }
        );
      }
    });
  }

  /**
   * Test authentication and get current auth info
   */
  async testAuth(): Promise<AuthTestResponse> {
    try {
      const response = await this.botClient.auth.test();

      if (!response.ok) {
        throw new SlackApiError(
          'Authentication test failed',
          'AUTH_TEST_FAILED',
          response
        );
      }

      return {
        success: true,
        teamId: response.team_id as string,
        teamName: response.team as string,
        userId: response.user_id as string,
        userName: response.user as string,
        botId: response.bot_id as string,
      };
    } catch (error) {
      if (error instanceof SlackApiError) {
        throw error;
      }

      throw new SlackApiError(
        'Failed to test authentication',
        'AUTH_TEST_ERROR',
        { originalError: error }
      );
    }
  }
}

/**
 * Custom error class for Slack API errors
 */
export class SlackApiError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'SlackApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Response types
 */
export interface ExchangeCodeResponse {
  success: boolean;
  accessToken: string;
  scope: string;
  teamId?: string;
  teamName?: string;
  userId?: string;
  botUserId?: string;
}

export interface SendMessageResponse {
  success: boolean;
  channelId: string;
  messageTs: string;
}

export interface UserInfoResponse {
  id: string;
  name: string;
  realName?: string;
  displayName: string;
  email?: string;
  image?: string;
  teamId: string;
  isBot: boolean;
  isAdmin: boolean;
  timezone?: string;
  timezoneLabel?: string;
}

export interface AuthTestResponse {
  success: boolean;
  teamId: string;
  teamName: string;
  userId: string;
  userName: string;
  botId: string;
}

/**
 * Create a configured Slack client instance (uses singleton for better connection reuse)
 */
export function createSlackClient(token?: string): SlackClient {
  return SlackClient.getInstance(token);
}

/**
 * Clear all caches (useful for testing or cache invalidation)
 */
export function clearSlackCaches(): void {
  userInfoCache.clear();
  channelCache.clear();
  // Clear singleton instance for testing
  (SlackClient as any).instance = undefined;
  logger.info('Slack caches cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    userInfo: userInfoCache.getStats(),
    channels: channelCache.getStats(),
  };
}
