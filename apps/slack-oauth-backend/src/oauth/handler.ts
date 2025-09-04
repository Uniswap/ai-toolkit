import { WebClient } from '@slack/web-api';
import { config } from '../config';
import {
  OAuthHandler,
  OAuthHandlerOptions,
  OAuthCallbackParams,
  OAuthResult,
  OAuthTokenResponse,
  OAuthError,
  SlackUserInfo,
} from './types';

/**
 * Implementation of OAuth handler for Slack
 */
export class SlackOAuthHandler implements OAuthHandler {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scopes: string[];
  private readonly validateStateFn?: (state: string | undefined) => boolean;
  private readonly webClient: WebClient;

  constructor(options: OAuthHandlerOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.redirectUri = options.redirectUri;
    this.scopes = options.scopes || [];
    this.validateStateFn = options.validateState;

    // Initialize Slack Web API client (without token for OAuth operations)
    this.webClient = new WebClient();
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: this.scopes.join(','),
    });

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  /**
   * Validate state parameter for CSRF protection
   */
  validateState(state: string | undefined): boolean {
    if (this.validateStateFn) {
      return this.validateStateFn(state);
    }

    // Default validation: ensure state exists and has minimum length
    return typeof state === 'string' && state.length >= 16;
  }

  /**
   * Handle OAuth callback from Slack
   */
  async handleCallback(params: OAuthCallbackParams): Promise<OAuthResult> {
    try {
      // Check for OAuth errors from Slack
      if (params.error) {
        throw new OAuthError(
          params.error_description ||
            `OAuth authorization failed: ${params.error}`,
          'invalid_code',
          { error: params.error, description: params.error_description }
        );
      }

      // Validate required parameters
      if (!params.code) {
        throw new OAuthError('Missing authorization code', 'invalid_code');
      }

      // Validate state parameter for CSRF protection
      if (!this.validateState(params.state)) {
        throw new OAuthError(
          'Invalid or missing state parameter',
          'state_mismatch',
          { providedState: params.state }
        );
      }

      // Exchange authorization code for access token
      const tokenResponse = await this.exchangeCodeForToken(params.code);

      if (!tokenResponse.ok || !tokenResponse.access_token) {
        throw new OAuthError(
          tokenResponse.error || 'Failed to exchange code for token',
          'token_exchange_failed',
          { response: tokenResponse }
        );
      }

      // Get user information using the bot token
      let userInfo: SlackUserInfo | undefined;
      if (tokenResponse.authed_user?.id) {
        userInfo = await this.getUserInfo(
          tokenResponse.authed_user.id,
          config.slackBotToken // Use bot token to get user info
        );
      }

      return {
        success: true,
        accessToken: tokenResponse.access_token,
        user: userInfo,
        details: {
          team: tokenResponse.team,
          enterprise: tokenResponse.enterprise,
          scopes: tokenResponse.scope,
          bot_user_id: tokenResponse.bot_user_id,
        },
      };
    } catch (error) {
      if (error instanceof OAuthError) {
        return {
          success: false,
          error: error.message,
          errorCode: error.code,
          details: error.details,
        };
      }

      // Handle unexpected errors
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: message,
        errorCode: 'unknown',
        details: { error: String(error) },
      };
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(
    code: string
  ): Promise<OAuthTokenResponse> {
    try {
      const response = await this.webClient.oauth.v2.access({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
      });

      return response as OAuthTokenResponse;
    } catch (error) {
      // Log error for debugging (in production, use proper logger)
      console.error('Token exchange failed:', error);

      if (error instanceof Error) {
        throw new OAuthError(
          `Token exchange failed: ${error.message}`,
          'token_exchange_failed',
          { originalError: error.message }
        );
      }

      throw new OAuthError('Token exchange failed', 'token_exchange_failed');
    }
  }

  /**
   * Get user information from Slack
   */
  private async getUserInfo(
    userId: string,
    token: string
  ): Promise<SlackUserInfo | undefined> {
    try {
      const client = new WebClient(token);
      const response = await client.users.info({ user: userId });

      if (response.ok && response.user) {
        const user = response.user as any;
        return {
          id: user.id,
          name: user.name,
          real_name: user.real_name,
          email: user.profile?.email,
          team_id: user.team_id,
          is_bot: user.is_bot || false,
          is_admin: user.is_admin,
          is_owner: user.is_owner,
          tz: user.tz,
          tz_label: user.tz_label,
          tz_offset: user.tz_offset,
        };
      }

      return undefined;
    } catch (error) {
      // Log error but don't fail the OAuth flow
      console.error('Failed to fetch user info:', error);
      return undefined;
    }
  }
}

/**
 * Create a configured OAuth handler instance
 */
export function createOAuthHandler(
  validateState?: (state: string | undefined) => boolean
): SlackOAuthHandler {
  return new SlackOAuthHandler({
    clientId: config.slackClientId,
    clientSecret: config.slackClientSecret,
    redirectUri: config.slackRedirectUri,
    scopes: [
      // User Token Scopes
      'channels:history',
      'channels:read',
      'chat:write',
      'groups:history',
      'groups:read',
      'im:history',
      'im:read',
      'im:write',
      'mpim:history',
      'mpim:read',
      'reactions:read',
      'reactions:write',
      'users.profile:read',
      'users:read',
    ], // All configured user token scopes
    validateState,
  });
}
