# Slack OAuth Implementation

## Purpose

Core OAuth 2.0 authentication flow implementation for Slack integration. Handles authorization code exchange, token management, and user authentication for the AI Toolkit's Slack features.

## Files

- `handler.ts` - OAuth flow handler implementation
- `types.ts` - TypeScript interfaces and types for OAuth
- `handler.spec.ts` - Tests for OAuth handler

## handler.ts

### Purpose

Implements the complete OAuth 2.0 authorization code flow for Slack:

1. **Authorization** - Redirect users to Slack for authorization
2. **Callback Handling** - Receive authorization code from Slack
3. **Token Exchange** - Exchange code for access token
4. **Token Storage** - Store tokens securely
5. **Error Handling** - Handle OAuth errors gracefully

### OAuth Flow

```
User → Start OAuth
  ↓
Redirect to Slack authorization URL
  ↓
User authorizes in Slack
  ↓
Slack redirects to callback URL with code
  ↓
Exchange code for access token
  ↓
Store tokens securely
  ↓
Redirect user to success page
```

### Expected Functions

```typescript
/**
 * Initialize OAuth flow
 * Returns authorization URL for user redirect
 */
export function getAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  scopes: string[],
  state?: string
): string;

/**
 * Handle OAuth callback
 * Exchange authorization code for access token
 */
export async function handleOAuthCallback(code: string, state?: string): Promise<OAuthResult>;

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<TokenResponse>;
```

### Security Considerations

1. **State Parameter**:

   - Generate cryptographically secure state
   - Validate state on callback
   - Prevent CSRF attacks

2. **Token Storage**:

   - Never expose access tokens to client
   - Encrypt tokens at rest
   - Use secure HTTP-only cookies

3. **Validation**:

   - Validate all callback parameters
   - Check for error responses from Slack
   - Verify redirect URI matches

4. **Rate Limiting**:
   - Implement rate limiting on OAuth endpoints
   - Prevent abuse and DoS attacks

### Integration with Slack Web API

```typescript
import { WebClient } from '@slack/web-api';

// Use access token with Slack API
const client = new WebClient(accessToken);
const result = await client.auth.test();
```

## types.ts

### Purpose

TypeScript type definitions for OAuth flow, Slack API responses, and internal data structures.

### Expected Types

```typescript
// OAuth request parameters
export interface OAuthParams {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
}

// OAuth callback parameters
export interface OAuthCallbackParams {
  code: string;
  state?: string;
  error?: string;
  error_description?: string;
}

// Token response from Slack
export interface TokenResponse {
  ok: boolean;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id?: string;
  app_id: string;
  team: {
    name: string;
    id: string;
  };
  enterprise?: {
    name: string;
    id: string;
  };
  authed_user: {
    id: string;
    scope: string;
    access_token: string;
    token_type: string;
  };
}

// OAuth result for internal use
export interface OAuthResult {
  success: boolean;
  accessToken?: string;
  userId?: string;
  teamId?: string;
  error?: string;
}
```

### Type Safety

All OAuth operations should be strongly typed:

```typescript
// Type-safe OAuth handler
async function handleOAuth(params: OAuthCallbackParams): Promise<OAuthResult> {
  // TypeScript ensures params match expected structure
  const { code, state } = params;

  // Return type is guaranteed
  return {
    success: true,
    accessToken: 'xoxb-...',
    userId: 'U123',
    teamId: 'T456',
  };
}
```

## handler.spec.ts

### Purpose

Comprehensive tests for OAuth flow implementation covering success cases, error handling, and security validations.

### Test Coverage

1. **Authorization URL Generation**:

   - Correct URL format
   - Proper parameter encoding
   - State parameter inclusion
   - Scope formatting

2. **Callback Handling**:

   - Success flow
   - Error responses from Slack
   - State validation
   - Missing parameters

3. **Token Exchange**:

   - Successful token exchange
   - API errors
   - Network failures
   - Invalid credentials

4. **Security**:
   - CSRF protection via state
   - Input validation
   - Error message sanitization

### Testing Patterns

```typescript
describe('OAuth Handler', () => {
  describe('getAuthorizationUrl', () => {
    it('should generate valid authorization URL', () => {
      const url = getAuthorizationUrl(clientId, redirectUri, scopes);
      expect(url).toContain('https://slack.com/oauth/v2/authorize');
      expect(url).toContain(`client_id=${clientId}`);
    });

    it('should include state parameter', () => {
      const state = 'random-state';
      const url = getAuthorizationUrl(clientId, redirectUri, scopes, state);
      expect(url).toContain(`state=${state}`);
    });
  });

  describe('handleOAuthCallback', () => {
    it('should exchange code for token', async () => {
      const result = await handleOAuthCallback('code-123');
      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
    });

    it('should handle Slack API errors', async () => {
      // Mock Slack API error
      const result = await handleOAuthCallback('invalid-code');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

## Usage in Application

### Express Route Integration

```typescript
import { handleOAuthCallback, getAuthorizationUrl } from './oauth/handler';

// Start OAuth flow
app.get('/auth/slack', (req, res) => {
  const authUrl = getAuthorizationUrl(
    process.env.SLACK_CLIENT_ID!,
    process.env.SLACK_REDIRECT_URI!,
    ['chat:write', 'channels:read']
  );
  res.redirect(authUrl);
});

// OAuth callback
app.get('/auth/slack/callback', async (req, res) => {
  const { code, state } = req.query;
  const result = await handleOAuthCallback(code as string, state as string);

  if (result.success) {
    res.redirect('/success');
  } else {
    res.redirect(`/error?message=${result.error}`);
  }
});
```

## Environment Configuration

Required environment variables (see parent app `.env.example`):

```bash
SLACK_CLIENT_ID=123456789.987654321
SLACK_CLIENT_SECRET=abcdef1234567890
SLACK_REDIRECT_URI=https://yourdomain.com/auth/slack/callback
```

## Related Documentation

- Parent application: `../../CLAUDE.md`
- Slack OAuth documentation: <https://api.slack.com/authentication/oauth-v2>
- Slack Web API: <https://api.slack.com/web>

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
