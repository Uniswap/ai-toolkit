import { WebClient } from '@slack/web-api';
import { config } from '../config';
import { logger } from '../utils/logger';
import type {
  OAuthHandler,
  OAuthHandlerOptions,
  OAuthCallbackParams,
  OAuthResult,
  OAuthTokenResponse,
  SlackUserInfo,
} from './types';
import { OAuthError } from './types';

/**
 * Implementation of OAuth handler for Slack
 */
export class SlackOAuthHandler implements OAuthHandler {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly botScopes: string[];
  private readonly userScopes: string[];
  private readonly validateStateFn?: (state: string | undefined) => boolean;
  private readonly webClient: WebClient;

  constructor(options: OAuthHandlerOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.redirectUri = options.redirectUri;
    // Back-compat: if only `scopes` provided, treat them as user scopes
    this.userScopes = options.userScopes || options.scopes || [];
    this.botScopes = options.botScopes || [];
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
    });

    // Granular permissions: bot scopes go in `scope`, user token scopes go in `user_scope`
    if (this.botScopes.length > 0) {
      params.set('scope', this.botScopes.join(','));
    }
    if (this.userScopes.length > 0) {
      params.set('user_scope', this.userScopes.join(','));
    }

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
          params.error_description || `OAuth authorization failed: ${params.error}`,
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
        throw new OAuthError('Invalid or missing state parameter', 'state_mismatch', {
          providedState: params.state,
        });
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

      // Enrich with user info using the bot token freshly issued by THIS
      // exchange. A static SLACK_BOT_TOKEN env var is incompatible with token
      // rotation (xoxe tokens expire ~12h) and dies on every reinstall, which
      // surfaced as `account_inactive` from users.info. The just-minted token
      // is always valid and carries users:read.
      let userInfo: SlackUserInfo | undefined;
      if (tokenResponse.authed_user?.id && tokenResponse.access_token) {
        userInfo = await this.getUserInfo(tokenResponse.authed_user.id, tokenResponse.access_token);
      }

      // Prefer the User OAuth Token (xoxp) if present; otherwise fall back to the Bot token
      const userToken = tokenResponse.authed_user?.access_token;
      const selectedToken = userToken || tokenResponse.access_token;

      // Use the refresh token that corresponds to the selected access token
      // If we selected user token, use user's refresh token; otherwise use bot's refresh token
      const userRefreshToken = tokenResponse.authed_user?.refresh_token;
      const selectedRefreshToken = userToken ? userRefreshToken : tokenResponse.refresh_token;

      return {
        success: true,
        accessToken: selectedToken,
        refreshToken: selectedRefreshToken,
        // Surface the fresh bot token so the route can authenticate post-install
        // actions (DM delivery) without a static, rotation-incompatible token.
        botAccessToken: tokenResponse.access_token,
        // The authed user's ID straight from the exchange. Present on a
        // user-token install (so DM delivery can target it even when the
        // users.info enrichment below returns undefined), but undefined on a
        // bot-only install where Slack returns no authed_user. The route guards
        // for that and falls back to the success page.
        userId: tokenResponse.authed_user?.id,
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
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
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
  private async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    try {
      const response = await this.webClient.oauth.v2.access({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
      });

      return response as OAuthTokenResponse;
    } catch (error) {
      // Log error for debugging
      logger.error('Token exchange failed:', error);

      if (error instanceof Error) {
        throw new OAuthError(`Token exchange failed: ${error.message}`, 'token_exchange_failed', {
          originalError: error.message,
        });
      }

      throw new OAuthError('Token exchange failed', 'token_exchange_failed');
    }
  }

  /**
   * Get user information from Slack
   */
  private async getUserInfo(userId: string, token: string): Promise<SlackUserInfo | undefined> {
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
      logger.error('Failed to fetch user info:', error);
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
    // Scopes are split between bot (xoxb) and user (xoxp) tokens.
    // Source of truth: Slack app manifest. Keep these arrays in sync with the
    // manifest's oauth_config.scopes.bot and oauth_config.scopes.user lists.
    botScopes: [
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
    ],
    userScopes: [
      'bookmarks:read',
      'bookmarks:write',
      'canvases:read',
      'canvases:write',
      'channels:history',
      'channels:read',
      'channels:write',
      'chat:write',
      'emoji:read',
      'files:read',
      'files:write',
      'groups:history',
      'groups:read',
      'groups:write',
      'im:history',
      'im:read',
      'im:write',
      'links.embed:write',
      'links:read',
      'links:write',
      'mpim:history',
      'mpim:read',
      'mpim:write',
      'pins:read',
      'pins:write',
      'reactions:read',
      'reactions:write',
      'reminders:read',
      'reminders:write',
      'search:read',
      'search:read.files',
      'search:read.im',
      'search:read.mpim',
      'search:read.private',
      'search:read.public',
      'search:read.users',
      'users.profile:read',
      'users:read',
      'users:read.email',
    ],
    validateState,
  });
}
