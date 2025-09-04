/**
 * Structured logging system with sanitization
 */

import { config } from '../config';
import { sanitizeError } from './errors';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  teamId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

/**
 * Logger class with structured logging and sanitization
 */
class Logger {
  private readonly logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private currentLevel: LogLevel;
  private readonly sensitivePatterns: RegExp[];

  constructor() {
    this.currentLevel = config.logLevel || 'info';

    // Patterns for sensitive data that should be redacted
    this.sensitivePatterns = [
      /xoxb-[A-Za-z0-9-]+/g, // Slack bot tokens
      /xoxp-[A-Za-z0-9-]+/g, // Slack user tokens
      /xoxa-[A-Za-z0-9-]+/g, // Slack app tokens
      /xoxr-[A-Za-z0-9-]+/g, // Slack refresh tokens
      /[A-Za-z0-9]{32,}/g, // Long random strings (potential secrets)
    ];
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.currentLevel];
  }

  /**
   * Sanitize sensitive data from log messages
   */
  private sanitize(data: any): any {
    if (typeof data === 'string') {
      let sanitized = data;
      for (const pattern of this.sensitivePatterns) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      }
      return sanitized;
    }

    if (typeof data === 'object' && data !== null) {
      return sanitizeError(data);
    }

    return data;
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const sanitizedContext = context ? this.sanitize(context) : {};

    const logObject = {
      timestamp,
      level: level.toUpperCase(),
      message: this.sanitize(message),
      ...sanitizedContext,
    };

    // In production, output as JSON for structured logging
    if (config.nodeEnv === 'production') {
      return JSON.stringify(logObject);
    }

    // In development, use a more readable format
    const contextStr =
      Object.keys(sanitizedContext).length > 0
        ? ` | ${JSON.stringify(sanitizedContext)}`
        : '';

    return `[${timestamp}] ${level.toUpperCase()}: ${this.sanitize(
      message
    )}${contextStr}`;
  }

  /**
   * Log methods
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error
          ? this.sanitize({
              message: error.message,
              stack: config.nodeEnv === 'development' ? error.stack : undefined,
              code: error.code,
              name: error.name,
            })
          : undefined,
      };

      console.error(this.formatMessage('error', message, errorContext));
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(req: any, res: any, duration: number): void {
    const context: LogContext = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      requestId: req.id,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    };

    const level: LogLevel =
      res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    this[level](`${req.method} ${req.path} ${res.statusCode}`, context);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context);
  }
}

/**
 * Child logger that includes additional context
 */
class ChildLogger {
  constructor(private parent: Logger, private context: LogContext) {}

  debug(message: string, additionalContext?: LogContext): void {
    this.parent.debug(message, { ...this.context, ...additionalContext });
  }

  info(message: string, additionalContext?: LogContext): void {
    this.parent.info(message, { ...this.context, ...additionalContext });
  }

  warn(message: string, additionalContext?: LogContext): void {
    this.parent.warn(message, { ...this.context, ...additionalContext });
  }

  error(
    message: string,
    error?: Error | any,
    additionalContext?: LogContext
  ): void {
    this.parent.error(message, error, {
      ...this.context,
      ...additionalContext,
    });
  }
}

// Create and export singleton logger instance
export const logger = new Logger();

// Export logger class for testing
export { Logger };
