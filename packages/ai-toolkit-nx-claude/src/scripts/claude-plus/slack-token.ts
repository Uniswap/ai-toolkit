/**
 * Slack Token Validation and Refresh
 *
 * Validates the current Slack OAuth token and refreshes it if expired.
 * This is a TypeScript port of the refresh-slack-token.sh script.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import * as os from 'os';
import { displaySuccess, displayWarning, displayDebug, displayInfo } from './display';
import { offerSlackSetup } from './slack-setup';

interface SlackConfig {
  refreshToken: string;
  refreshUrl: string;
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

// Legacy config path (user's personal Claude config)
const CLAUDE_LEGACY_CONFIG_PATH = path.join(os.homedir(), '.claude.json');
// New settings path (Claude settings including plugin-provided MCP servers)
const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const SLACK_ENV_PATH = path.join(os.homedir(), '.config', 'claude-code', 'slack-env.sh');

/**
 * Load Slack OAuth configuration from environment or config file
 */
function loadSlackConfig(): SlackConfig | null {
  // First try environment variables
  const refreshToken = process.env.SLACK_REFRESH_TOKEN;
  const refreshUrl = process.env.SLACK_REFRESH_URL;

  if (refreshToken && refreshUrl) {
    return { refreshToken, refreshUrl };
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

    if (envVars.SLACK_REFRESH_TOKEN && envVars.SLACK_REFRESH_URL) {
      return {
        refreshToken: envVars.SLACK_REFRESH_TOKEN,
        refreshUrl: envVars.SLACK_REFRESH_URL,
      };
    }
  }

  return null;
}

/**
 * Get the current Slack token from Claude config
 * Checks both legacy (~/.claude.json) and new (~/.claude/settings.json) locations
 * for backwards compatibility
 */
function getCurrentToken(): string | null {
  // Check both config locations for backwards compatibility
  const configPaths = [
    { path: CLAUDE_SETTINGS_PATH, name: 'settings.json' },
    { path: CLAUDE_LEGACY_CONFIG_PATH, name: 'legacy .claude.json' },
  ];

  for (const { path: configPath } of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const token = config?.mcpServers?.['slack']?.env?.SLACK_BOT_TOKEN;
        if (token) {
          return token;
        }
      } catch {
        // Config parse error, continue checking
        continue;
      }
    }
  }

  return null;
}

/**
 * Determine which config file contains the Slack MCP configuration
 * Returns the path to the config file that should be updated
 */
function getSlackConfigPath(): string {
  // Prefer settings.json if it has a slack config
  if (fs.existsSync(CLAUDE_SETTINGS_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf-8'));
      if (config?.mcpServers?.['slack']) {
        return CLAUDE_SETTINGS_PATH;
      }
    } catch {
      // Config parse error, continue
    }
  }

  // Check legacy config
  if (fs.existsSync(CLAUDE_LEGACY_CONFIG_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CLAUDE_LEGACY_CONFIG_PATH, 'utf-8'));
      if (config?.mcpServers?.['slack']) {
        return CLAUDE_LEGACY_CONFIG_PATH;
      }
    } catch {
      // Config parse error, continue
    }
  }

  // Default to settings.json for new installations (plugin-based)
  return CLAUDE_SETTINGS_PATH;
}

/**
 * Make an HTTP/HTTPS POST request (protocol-aware)
 */
function httpPost(url: string, data: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const defaultPort = isHttps ? 443 : 80;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port ? parseInt(urlObj.port, 10) : defaultPort,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const requestModule = isHttps ? https : http;
    const req = requestModule.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        // Check HTTP status code for network-level errors
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        } else {
          resolve(body);
        }
      });
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
      res.on('end', () => {
        // Check HTTP status code for network-level errors
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        } else {
          resolve(body);
        }
      });
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
 * Refresh the OAuth token using backend endpoint
 */
async function refreshOAuthToken(
  config: SlackConfig,
  verbose?: boolean
): Promise<{ accessToken: string; refreshToken?: string }> {
  displayDebug('Refreshing OAuth token via backend...', verbose);

  // Construct the backend refresh endpoint URL (handle trailing slash)
  const baseUrl = config.refreshUrl.replace(/\/+$/, ''); // Remove trailing slashes
  const refreshEndpoint = `${baseUrl}/slack/refresh`;
  displayDebug(`Calling refresh endpoint: ${refreshEndpoint}`, verbose);

  const payload = JSON.stringify({
    refresh_token: config.refreshToken,
  });

  const response = await httpPost(refreshEndpoint, payload, {
    'Content-Type': 'application/json',
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
 * Updates the config file that currently contains the Slack MCP configuration
 */
function updateClaudeConfig(newToken: string, verbose?: boolean): void {
  displayDebug('Updating Claude config...', verbose);

  // Determine which config file to update
  const configPath = getSlackConfigPath();
  displayDebug(`Using config path: ${configPath}`, verbose);

  // Read current config
  let config: Record<string, unknown> = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  // Ensure the directory exists for settings.json
  if (configPath === CLAUDE_SETTINGS_PATH) {
    const settingsDir = path.dirname(configPath);
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true, mode: 0o700 });
    }
  }

  // Ensure the path exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  const mcpServers = config.mcpServers as Record<string, unknown>;
  if (!mcpServers['slack']) {
    mcpServers['slack'] = {};
  }
  const slack = mcpServers['slack'] as Record<string, unknown>;
  if (!slack.env) {
    slack.env = {};
  }
  const env = slack.env as Record<string, string>;

  // Update the token
  env.SLACK_BOT_TOKEN = newToken;

  // Write back
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
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
  let config = loadSlackConfig();

  if (!config) {
    // Offer interactive setup if config is missing
    const setupCompleted = await offerSlackSetup(verbose);

    if (setupCompleted) {
      // Reload config after setup
      config = loadSlackConfig();
    }

    if (!config) {
      // User declined setup or setup failed
      displayDebug('Slack configuration not available. Skipping token validation.', verbose);
      return;
    }
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
