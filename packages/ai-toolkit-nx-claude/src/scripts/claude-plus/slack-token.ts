/**
 * Slack Token Validation and Refresh
 *
 * Validates the current Slack OAuth token and refreshes it if expired.
 * This is a TypeScript port of the refresh-slack-token.sh script.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { displaySuccess, displayWarning, displayDebug, displayInfo } from './display';

interface SlackConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

interface TokenRefreshResponse {
  ok: boolean;
  access_token?: string;
  refresh_token?: string;
  error?: string;
}

interface AuthTestResponse {
  ok: boolean;
  error?: string;
}

const CLAUDE_CONFIG_PATH = path.join(process.env.HOME || '', '.claude.json');
const SLACK_ENV_PATH = path.join(process.env.HOME || '', '.config', 'claude-code', 'slack-env.sh');

/**
 * Load Slack OAuth configuration from environment or config file
 */
function loadSlackConfig(): SlackConfig | null {
  // First try environment variables
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const refreshToken = process.env.SLACK_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    return { clientId, clientSecret, refreshToken };
  }

  // Try loading from slack-env.sh
  if (fs.existsSync(SLACK_ENV_PATH)) {
    const content = fs.readFileSync(SLACK_ENV_PATH, 'utf-8');
    const envVars: Record<string, string> = {};

    // Parse export statements
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^export\s+(\w+)=["']?([^"'\n]+)["']?/);
      if (match) {
        envVars[match[1]] = match[2];
      }
    }

    if (envVars.SLACK_CLIENT_ID && envVars.SLACK_CLIENT_SECRET && envVars.SLACK_REFRESH_TOKEN) {
      return {
        clientId: envVars.SLACK_CLIENT_ID,
        clientSecret: envVars.SLACK_CLIENT_SECRET,
        refreshToken: envVars.SLACK_REFRESH_TOKEN,
      };
    }
  }

  return null;
}

/**
 * Get the current Slack token from Claude config
 */
function getCurrentToken(): string | null {
  if (!fs.existsSync(CLAUDE_CONFIG_PATH)) {
    return null;
  }

  try {
    const config = JSON.parse(fs.readFileSync(CLAUDE_CONFIG_PATH, 'utf-8'));
    return config?.mcpServers?.['zencoder-slack']?.env?.SLACK_BOT_TOKEN || null;
  } catch {
    return null;
  }
}

/**
 * Make an HTTPS POST request
 */
function httpsPost(url: string, data: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve(body));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Make an HTTPS GET request with Authorization header
 */
function httpsGet(url: string, token: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve(body));
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Test if the current token is valid
 */
async function testToken(token: string, verbose?: boolean): Promise<boolean> {
  displayDebug('Testing current token validity...', verbose);

  try {
    const response = await httpsGet('https://slack.com/api/auth.test', token);
    const data: AuthTestResponse = JSON.parse(response);

    if (data.ok) {
      displayDebug('Token is valid', verbose);
      return true;
    }

    displayDebug(`Token validation failed: ${data.error}`, verbose);
    return false;
  } catch (error) {
    displayDebug(`Token test error: ${error}`, verbose);
    return false;
  }
}

/**
 * Refresh the OAuth token
 */
async function refreshOAuthToken(
  config: SlackConfig,
  verbose?: boolean
): Promise<{ accessToken: string; refreshToken?: string }> {
  displayDebug('Refreshing OAuth token...', verbose);

  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: config.refreshToken,
  });

  const response = await httpsPost('https://slack.com/api/oauth.v2.access', params.toString(), {
    'Content-Type': 'application/x-www-form-urlencoded',
  });

  const data: TokenRefreshResponse = JSON.parse(response);

  if (!data.ok || !data.access_token) {
    throw new Error(`Failed to refresh token: ${data.error || 'Unknown error'}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

/**
 * Update the Claude config with the new token
 */
function updateClaudeConfig(newToken: string, verbose?: boolean): void {
  displayDebug('Updating Claude config...', verbose);

  // Read current config
  let config: Record<string, unknown> = {};
  if (fs.existsSync(CLAUDE_CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CLAUDE_CONFIG_PATH, 'utf-8'));
  }

  // Ensure the path exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  const mcpServers = config.mcpServers as Record<string, unknown>;
  if (!mcpServers['zencoder-slack']) {
    mcpServers['zencoder-slack'] = {};
  }
  const zencoderSlack = mcpServers['zencoder-slack'] as Record<string, unknown>;
  if (!zencoderSlack.env) {
    zencoderSlack.env = {};
  }
  const env = zencoderSlack.env as Record<string, string>;

  // Update the token
  env.SLACK_BOT_TOKEN = newToken;

  // Write back
  fs.writeFileSync(CLAUDE_CONFIG_PATH, JSON.stringify(config, null, 2));
  displayDebug('Claude config updated successfully', verbose);
}

/**
 * Update the refresh token in slack-env.sh
 */
function updateRefreshToken(newRefreshToken: string, verbose?: boolean): void {
  if (!fs.existsSync(SLACK_ENV_PATH)) {
    displayDebug('slack-env.sh not found, skipping refresh token update', verbose);
    return;
  }

  displayDebug('Updating refresh token in slack-env.sh...', verbose);

  let content = fs.readFileSync(SLACK_ENV_PATH, 'utf-8');

  // Replace the refresh token line
  content = content.replace(
    /export SLACK_REFRESH_TOKEN=.*/,
    `export SLACK_REFRESH_TOKEN="${newRefreshToken}"`
  );

  fs.writeFileSync(SLACK_ENV_PATH, content);
  displayDebug('Refresh token updated successfully', verbose);
}

/**
 * Main function to validate and refresh Slack token
 */
export async function validateAndRefreshSlackToken(verbose?: boolean): Promise<void> {
  // Load Slack config
  const config = loadSlackConfig();

  if (!config) {
    displayWarning('Slack OAuth configuration not found. Skipping token validation.');
    displayWarning('To enable token refresh, set environment variables:');
    displayWarning('  SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_REFRESH_TOKEN');
    displayWarning(`Or create ${SLACK_ENV_PATH}`);
    return;
  }

  // Get current token
  const currentToken = getCurrentToken();

  if (!currentToken) {
    displayWarning('No Slack token found in Claude config. Attempting to get one...');
  } else {
    // Test if current token is valid
    const isValid = await testToken(currentToken, verbose);
    if (isValid) {
      displaySuccess('Slack token is valid');
      return;
    }

    displayInfo('  Slack token is expired or invalid. Refreshing...');
  }

  // Refresh the token
  try {
    const { accessToken, refreshToken } = await refreshOAuthToken(config, verbose);

    // Update Claude config
    updateClaudeConfig(accessToken, verbose);

    // Update refresh token if provided (Slack refresh tokens are single-use)
    if (refreshToken) {
      updateRefreshToken(refreshToken, verbose);
    }

    displaySuccess('Slack token refreshed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to refresh Slack token: ${errorMessage}`);
  }
}
