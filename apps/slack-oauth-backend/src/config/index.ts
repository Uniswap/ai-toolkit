import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file in development
if (process.env['NODE_ENV'] !== 'production') {
  dotenv.config({ path: resolve(__dirname, '../../.env') });
}

export interface Config {
  // Server configuration
  port: number;
  nodeEnv: 'development' | 'production' | 'test';

  // Slack OAuth configuration
  slackClientId: string;
  slackClientSecret: string;
  slackRedirectUri: string;

  // Slack Bot configuration
  slackBotToken: string;

  // Security
  sessionSecret: string;

  // Optional configurations
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  corsOrigin?: string;

  // Documentation URL
  notionDocUrl: string;
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new ConfigurationError(
      `Missing required environment variable: ${key}`
    );
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function createConfig(): Config {
  try {
    return {
      // Server configuration
      port: parseInt(process.env['PORT'] ?? '3000', 10),
      nodeEnv: (process.env['NODE_ENV'] ?? 'development') as Config['nodeEnv'],

      // Slack OAuth configuration
      slackClientId: getRequiredEnv('SLACK_CLIENT_ID'),
      slackClientSecret: getRequiredEnv('SLACK_CLIENT_SECRET'),
      slackRedirectUri: getRequiredEnv('SLACK_REDIRECT_URI'),

      // Slack Bot configuration
      slackBotToken: getRequiredEnv('SLACK_BOT_TOKEN'),

      // Security
      sessionSecret: getRequiredEnv('SESSION_SECRET'),

      // Optional configurations
      logLevel: getOptionalEnv('LOG_LEVEL', 'info') as Config['logLevel'],
      corsOrigin: process.env['CORS_ORIGIN'],

      // Documentation URL
      notionDocUrl: getOptionalEnv(
        'NOTION_DOC_URL',
        'https://www.notion.so/uniswaplabs/Using-a-Slack-MCP-with-Claude-Claude-Code-249c52b2548b8052b901dc05d90e57fc?source=copy_link'
      ),
    };
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error(`Configuration Error: ${error.message}`);
      console.error(
        'Please ensure all required environment variables are set.'
      );
      console.error('See .env.example for required variables.');
      process.exit(1);
    }
    throw error;
  }
}

// Create and export the configuration
export const config = createConfig();

// Validate configuration on startup
export function validateConfig(): void {
  const requiredFields: (keyof Config)[] = [
    'slackClientId',
    'slackClientSecret',
    'slackRedirectUri',
    'slackBotToken',
    'sessionSecret',
  ];

  const missingFields = requiredFields.filter((field) => !config[field]);

  if (missingFields.length > 0) {
    throw new ConfigurationError(
      `Missing required configuration fields: ${missingFields.join(', ')}`
    );
  }

  // Validate port
  if (isNaN(config.port) || config.port < 0 || config.port > 65535) {
    throw new ConfigurationError(`Invalid port number: ${config.port}`);
  }

  // Validate log level
  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(config.logLevel)) {
    throw new ConfigurationError(`Invalid log level: ${config.logLevel}`);
  }

  console.log('✅ Configuration validated successfully');
}
