import { config } from '../config';

/**
 * Message formatter for Slack messages
 */

/**
 * Format token delivery message with Slack blocks
 */
export function formatTokenMessage(
  token: string,
  userName?: string,
  refreshToken?: string
): TokenMessage {
  const greeting = userName ? `Hi ${userName}! 👋` : 'Hi there! 👋';

  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔐 Your Slack Tokens',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${greeting}\n\nYour Slack tokens have been generated successfully! You can use these tokens to integrate with Slack APIs.`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Access Token:*\n_Use this for API calls_',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `\`\`\`${token}\`\`\``,
      },
    },
  ];

  if (refreshToken) {
    blocks.push(
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Refresh Token:*\n_Use this to refresh your access token when it expires_',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`${refreshToken}\`\`\``,
        },
      }
    );
  }

  blocks.push(
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '📚 *Setup Instructions*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `For detailed setup instructions and how to use these tokens, please refer to our documentation:\n<${config.notionDocUrl}|View Setup Guide>`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '⚠️ *Security Notice:* Keep these tokens secure and never share them publicly. Treat them like passwords.',
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: refreshToken
            ? '💡 *Tip:* Store both tokens securely in your environment variables. The refresh token can be used to obtain a new access token when needed.'
            : '💡 *Tip:* This token will remain valid until revoked. Store it securely in your environment variables.',
        },
      ],
    }
  );

  const text = refreshToken
    ? `${greeting} Your Slack access token: ${token}\n\nYour refresh token: ${refreshToken}\n\nFor setup instructions, visit: ${config.notionDocUrl}`
    : `${greeting} Your Slack access token: ${token}\n\nFor setup instructions, visit: ${config.notionDocUrl}`;

  return {
    blocks,
    text, // Fallback text for notifications
  };
}

/**
 * Format error message for user
 */
export function formatErrorMessage(error: ErrorType, details?: string): ErrorMessage {
  const errorMessages: Record<ErrorType, { title: string; description: string; action: string }> = {
    invalid_code: {
      title: '❌ Invalid Authorization Code',
      description: 'The authorization code provided is invalid or has expired.',
      action: 'Please try authorizing again by clicking the "Add to Slack" button.',
    },
    state_mismatch: {
      title: '🛡️ Security Check Failed',
      description: 'The security validation failed. This might be due to an expired session.',
      action: 'Please start the authorization process again from the beginning.',
    },
    token_exchange_failed: {
      title: '🔄 Token Exchange Failed',
      description: "We couldn't exchange your authorization code for an access token.",
      action: 'This might be a temporary issue. Please try again in a few moments.',
    },
    user_fetch_failed: {
      title: '👤 User Information Error',
      description: "We couldn't retrieve your user information from Slack.",
      action: "The token was generated but we couldn't send it via DM. Please contact support.",
    },
    dm_failed: {
      title: '📨 Message Delivery Failed',
      description: "Your token was generated but we couldn't send it via direct message.",
      action: 'Please ensure the bot is installed in your workspace and try again.',
    },
    configuration_error: {
      title: '⚙️ Configuration Error',
      description: 'The service is not properly configured.',
      action: 'Please contact your administrator to resolve this issue.',
    },
    unknown: {
      title: '😕 Unexpected Error',
      description: 'An unexpected error occurred during the authorization process.',
      action: 'Please try again. If the problem persists, contact support.',
    },
  };

  const errorInfo = errorMessages[error] || errorMessages.unknown;

  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: errorInfo.title,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: errorInfo.description,
      },
    },
  ];

  if (details) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Details:* ${details}`,
      },
    });
  }

  blocks.push(
    {
      type: 'divider' as const,
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*What to do next:*\n${errorInfo.action}`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Need help? Check our <${config.notionDocUrl}|documentation> or contact support.`,
        },
      ],
    }
  );

  const text = `${errorInfo.title}\n\n${errorInfo.description}\n\nWhat to do: ${errorInfo.action}`;

  return {
    blocks,
    text,
  };
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format success page HTML
 */
export function formatSuccessPage(
  userName?: string,
  tokenToDisplay?: string,
  refreshTokenToDisplay?: string,
  refreshUrl?: string
): string {
  const safeUserName = userName ? escapeHtml(userName) : undefined;
  const safeToken = tokenToDisplay ? escapeHtml(tokenToDisplay) : undefined;
  const safeRefreshToken = refreshTokenToDisplay ? escapeHtml(refreshTokenToDisplay) : undefined;
  const safeRefreshUrl = refreshUrl ? escapeHtml(refreshUrl) : undefined;
  const title = safeUserName ? `Success, ${safeUserName}!` : 'Success!';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Authorization Successful</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 48px;
          max-width: 600px;
          text-align: center;
        }
        .success-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .success-icon svg {
          width: 40px;
          height: 40px;
          stroke: white;
          stroke-width: 3;
        }
        h1 {
          color: #1f2937;
          font-size: 32px;
          margin: 0 0 16px;
        }
        h2 {
          color: #1f2937;
          font-size: 18px;
          margin: 16px 0 8px;
          text-align: left;
        }
        p {
          color: #6b7280;
          font-size: 18px;
          line-height: 1.5;
          margin: 0 0 32px;
        }
        .token-container {
          background: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          margin: 16px 0;
          word-break: break-all;
          text-align: left;
        }
        .token-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
          text-transform: uppercase;
          font-weight: 600;
        }
        .button {
          display: inline-block;
          background: #7c3aed;
          color: white;
          padding: 12px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: background 0.2s;
        }
        .button:hover {
          background: #6d28d9;
        }
        .note {
          margin-top: 32px;
          padding: 16px;
          background: #fef3c7;
          border-radius: 8px;
          color: #92400e;
          font-size: 14px;
          text-align: left;
        }
        .info-box {
          margin-top: 24px;
          padding: 16px;
          background: #eff6ff;
          border-radius: 8px;
          color: #1e40af;
          font-size: 14px;
          text-align: left;
        }
        .info-box strong {
          display: block;
          margin-bottom: 8px;
        }
        code {
          font-size: 14px;
          color: #1f2937;
          background: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">
          <svg fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1>${title}</h1>
        ${
          safeToken
            ? `
        <p>Your Slack authorization was successful! We couldn't send your tokens via DM (the bot may need the <code>im:write</code> permission), but here they are:</p>

        <h2>Access Token</h2>
        <div class="token-container">
          <div class="token-label">Use for API calls</div>
          <code style="font-size: 14px; color: #1f2937;">${safeToken}</code>
        </div>

        ${
          safeRefreshToken
            ? `
        <h2>Refresh Token</h2>
        <div class="token-container">
          <div class="token-label">Use to refresh when access token expires</div>
          <code style="font-size: 14px; color: #1f2937;">${safeRefreshToken}</code>
        </div>

        ${
          safeRefreshUrl
            ? `
        <div class="info-box">
          <strong>Token Refresh Endpoint:</strong>
          To refresh your access token, send a POST request to:<br>
          <code>${safeRefreshUrl}</code><br>
          <br>
          Include your refresh token in the request body.
        </div>
        `
            : ''
        }
        `
            : ''
        }

        <p style="color: #ef4444; font-size: 14px; margin-top: 16px;">
          ⚠️ <strong>Important:</strong> Copy these tokens now! This page won't be shown again.
        </p>
        `
            : `
        <p>Your Slack authorization was successful! Your tokens have been sent to you via Slack direct message.</p>
        `
        }
        <a href="${escapeHtml(config.notionDocUrl)}" class="button">View Setup Guide</a>
        <div class="note">
          💡 <strong>Next steps:</strong> ${
            safeToken ? 'Copy your tokens above and' : 'Check your Slack DMs for your tokens and'
          } follow the setup guide to complete the integration.
          ${
            safeRefreshToken
              ? '<br><br>Store both your access token and refresh token securely. When your access token expires, use the refresh token to obtain a new one.'
              : ''
          }
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Format error page HTML
 */
export function formatErrorPage(error: ErrorType, details?: string): string {
  const errorMessages: Record<ErrorType, string> = {
    invalid_code: 'The authorization code is invalid or expired.',
    state_mismatch: 'Security validation failed.',
    token_exchange_failed: 'Could not exchange authorization code.',
    user_fetch_failed: 'Could not retrieve user information.',
    dm_failed: 'Could not send direct message.',
    configuration_error: 'Service configuration error.',
    unknown: 'An unexpected error occurred.',
  };

  const errorMessage = errorMessages[error] || errorMessages.unknown;
  const safeDetails = details ? escapeHtml(details) : undefined;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Authorization Failed</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 48px;
          max-width: 480px;
          text-align: center;
        }
        .error-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .error-icon svg {
          width: 40px;
          height: 40px;
          stroke: white;
          stroke-width: 3;
        }
        h1 {
          color: #1f2937;
          font-size: 32px;
          margin: 0 0 16px;
        }
        p {
          color: #6b7280;
          font-size: 18px;
          line-height: 1.5;
          margin: 0 0 32px;
        }
        .error-details {
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px;
          margin: 0 0 24px;
          color: #991b1b;
          font-size: 14px;
          font-family: monospace;
        }
        .button {
          display: inline-block;
          background: #7c3aed;
          color: white;
          padding: 12px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: background 0.2s;
          margin: 0 8px;
        }
        .button:hover {
          background: #6d28d9;
        }
        .button.secondary {
          background: #6b7280;
        }
        .button.secondary:hover {
          background: #4b5563;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">
          <svg fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1>Authorization Failed</h1>
        <p>${escapeHtml(errorMessage)}</p>
        ${safeDetails ? `<div class="error-details">${safeDetails}</div>` : ''}
        <div>
          <a href="/" class="button">Try Again</a>
          <a href="${escapeHtml(config.notionDocUrl)}" class="button secondary">Get Help</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Type definitions
 */
export interface TokenMessage {
  blocks: any[];
  text: string;
}

export interface ErrorMessage {
  blocks: any[];
  text: string;
}

export type ErrorType =
  | 'invalid_code'
  | 'state_mismatch'
  | 'token_exchange_failed'
  | 'user_fetch_failed'
  | 'dm_failed'
  | 'configuration_error'
  | 'unknown';
