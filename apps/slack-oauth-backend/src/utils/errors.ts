/**
 * Centralized error handling utilities
 */

/**
 * Base error class for application errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    isOperational = true,
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize error for safe logging (remove sensitive data)
   */
  toSafeObject(): SafeErrorObject {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      // Don't include details in safe object as it may contain sensitive data
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * OAuth specific errors
 */
export class OAuthError extends AppError {
  constructor(
    message: string,
    code: OAuthErrorCode = 'OAUTH_ERROR',
    details?: any
  ) {
    const statusCode = oauthErrorStatusCodes[code] || 500;
    super(message, statusCode, code, true, details);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, field?: string, value?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, {
      field,
      value: value !== undefined ? '[REDACTED]' : undefined,
    });
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends AppError {
  constructor(message: string, missingVar?: string) {
    super(
      message,
      500,
      'CONFIGURATION_ERROR',
      false, // Configuration errors are not operational
      { missingVar }
    );
  }
}

/**
 * Slack API errors
 */
export class SlackApiError extends AppError {
  constructor(message: string, slackError?: string, response?: any) {
    super(message, 503, 'SLACK_API_ERROR', true, {
      slackError,
      responseStatus: response?.status,
    });
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_ERROR', true, { retryAfter });
    this.retryAfter = retryAfter;
  }
}

/**
 * OAuth error codes and their HTTP status codes
 */
const oauthErrorStatusCodes: Record<OAuthErrorCode, number> = {
  OAUTH_ERROR: 500,
  INVALID_CODE: 400,
  STATE_MISMATCH: 400,
  TOKEN_EXCHANGE_FAILED: 502,
  USER_FETCH_FAILED: 502,
  DM_SEND_FAILED: 502,
  MISSING_PARAMS: 400,
  INVALID_STATE: 400,
};

/**
 * Error recovery strategies
 */
export const errorRecoveryStrategies: Record<string, ErrorRecoveryStrategy> = {
  RATE_LIMIT_ERROR: {
    shouldRetry: true,
    maxRetries: 3,
    backoffMs: (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000),
    recoveryAction: 'Wait and retry with exponential backoff',
  },
  SLACK_API_ERROR: {
    shouldRetry: true,
    maxRetries: 2,
    backoffMs: () => 1000,
    recoveryAction: 'Retry Slack API call',
  },
  TOKEN_EXCHANGE_FAILED: {
    shouldRetry: false,
    maxRetries: 0,
    backoffMs: () => 0,
    recoveryAction: 'Prompt user to re-authorize',
  },
  CONFIGURATION_ERROR: {
    shouldRetry: false,
    maxRetries: 0,
    backoffMs: () => 0,
    recoveryAction: 'Fix configuration and restart service',
  },
};

/**
 * Error handler middleware for Express
 */
export function errorHandler(err: Error, req: any, res: any, _next: any): void {
  // Default to 500 server error
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;

    // Log operational errors at warn level, others at error level
    const logLevel = err.isOperational ? 'warn' : 'error';
    console[logLevel]('Application error:', err.toSafeObject());
  } else {
    // Unknown errors - log full error internally but don't expose details
    console.error('Unhandled error:', err);
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown',
    },
  });

  // For non-operational errors in production, consider shutting down gracefully
  if (!isOperationalError(err) && process.env['NODE_ENV'] === 'production') {
    console.error(
      'Non-operational error detected, initiating graceful shutdown...'
    );
    process.exit(1);
  }
}

/**
 * Determine if an error is operational
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Sanitize error for logging (remove sensitive data)
 */
export function sanitizeError(error: any): any {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
    'api_key',
    'apiKey',
    'client_secret',
    'clientSecret',
  ];

  if (typeof error !== 'object' || error === null) {
    return error;
  }

  const sanitized = { ...error };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeError(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Type definitions
 */
export type OAuthErrorCode =
  | 'OAUTH_ERROR'
  | 'INVALID_CODE'
  | 'STATE_MISMATCH'
  | 'TOKEN_EXCHANGE_FAILED'
  | 'USER_FETCH_FAILED'
  | 'DM_SEND_FAILED'
  | 'MISSING_PARAMS'
  | 'INVALID_STATE';

export interface SafeErrorObject {
  name: string;
  message: string;
  code: string;
  statusCode: number;
  isOperational: boolean;
  timestamp: string;
}

export interface ErrorRecoveryStrategy {
  shouldRetry: boolean;
  maxRetries: number;
  backoffMs: (attempt: number) => number;
  recoveryAction: string;
}
