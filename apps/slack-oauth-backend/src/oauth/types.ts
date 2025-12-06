/**
 * OAuth Types and Interfaces
 */

/**
 * OAuth callback parameters received from Slack
 */
export interface OAuthCallbackParams {
  /** Authorization code from Slack */
  code?: string;
  /** State parameter for CSRF protection */
  state?: string;
  /** Error code if authorization failed */
  error?: string;
  /** Error description if authorization failed */
  error_description?: string;
}

/**
 * Result of OAuth token exchange
 */
export interface OAuthTokenResponse {
  /** Whether the operation was successful */
  ok: boolean;
  /** Access token for the workspace */
  access_token?: string;
  /** Refresh token for token rotation (when token rotation is enabled) */
  refresh_token?: string;
  /** Token type (usually "bot") */
  token_type?: string;
  /** OAuth scopes granted */
  scope?: string;
  /** Bot user ID */
  bot_user_id?: string;
  /** App ID */
  app_id?: string;
  /** Team information */
  team?: {
    id: string;
    name: string;
  };
  /** Enterprise information (if applicable) */
  enterprise?: {
    id: string;
    name: string;
  };
  /** Authed user information */
  authed_user?: {
    id: string;
    scope?: string;
    access_token?: string;
    token_type?: string;
  };
  /** Error message if failed */
  error?: string;
  /** Detailed error description */
  error_description?: string;
}

/**
 * User information from Slack
 */
export interface SlackUserInfo {
  /** User ID */
  id: string;
  /** User's display name */
  name: string;
  /** User's real name */
  real_name?: string;
  /** User's email */
  email?: string;
  /** Team ID */
  team_id: string;
  /** Whether user is a bot */
  is_bot: boolean;
  /** Whether user is an admin */
  is_admin?: boolean;
  /** Whether user is an owner */
  is_owner?: boolean;
  /** User's timezone */
  tz?: string;
  /** User's timezone label */
  tz_label?: string;
  /** User's timezone offset */
  tz_offset?: number;
}

/**
 * Result of the OAuth flow
 */
export interface OAuthResult {
  /** Whether the OAuth flow was successful */
  success: boolean;
  /** Access token if successful */
  accessToken?: string;
  /** Refresh token if successful (when token rotation is enabled) */
  refreshToken?: string;
  /** User information if successful */
  user?: SlackUserInfo;
  /** Error message if failed */
  error?: string;
  /** Error code for client */
  errorCode?:
    | 'invalid_code'
    | 'state_mismatch'
    | 'token_exchange_failed'
    | 'user_fetch_failed'
    | 'dm_failed'
    | 'unknown';
  /** Additional details for debugging */
  details?: Record<string, unknown>;
}

/**
 * OAuth handler interface
 */
export interface OAuthHandler {
  /**
   * Handle OAuth callback from Slack
   * @param params - OAuth callback parameters
   * @returns OAuth result with token and user info
   */
  handleCallback(params: OAuthCallbackParams): Promise<OAuthResult>;

  /**
   * Generate OAuth authorization URL
   * @param state - State parameter for CSRF protection
   * @returns Authorization URL
   */
  generateAuthUrl(state: string): string;

  /**
   * Validate state parameter
   * @param state - State parameter to validate
   * @returns Whether state is valid
   */
  validateState(state: string | undefined): boolean;
}

/**
 * Options for OAuth handler initialization
 */
export interface OAuthHandlerOptions {
  /** Slack client ID */
  clientId: string;
  /** Slack client secret */
  clientSecret: string;
  /** OAuth redirect URI */
  redirectUri: string;
  /** Optional bot token scopes to request (for xoxb) */
  botScopes?: string[];
  /** Optional user token scopes to request (for xoxp) */
  userScopes?: string[];
  /** Back-compat: if provided without userScopes, treated as userScopes */
  scopes?: string[];
  /** State validation function */
  validateState?: (state: string | undefined) => boolean;
}

/**
 * OAuth error class
 */
export class OAuthError extends Error {
  public readonly code: OAuthResult['errorCode'];
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: OAuthResult['errorCode'] = 'unknown',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OAuthError';
    this.code = code;
    this.details = details;
  }
}
