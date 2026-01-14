/**
 * Re-export all types from the types directory.
 * This file provides backwards compatibility for existing imports.
 *
 * @packageDocumentation
 */

// Re-export all types from the comprehensive types module
export type * from './types/index.js';

// Additional legacy types that are used by exchange-format.ts
// These complement the types exported from types/index.ts

/**
 * Validation result for exchange format validation.
 */
export interface ValidationResult {
  /** Whether the exchange format is valid */
  valid: boolean;
  /** Validation errors if any */
  errors: ValidationError[];
  /** Validation warnings if any */
  warnings: ValidationWarning[];
}

/**
 * A validation error.
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Path in the object where the error occurred */
  path?: string;
}

/**
 * A validation warning.
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Path in the object where the warning occurred */
  path?: string;
}

/**
 * Metadata for the exchange format.
 */
export interface ExchangeMetadata {
  /** ISO timestamp when the exchange was created */
  createdAt: string;
  /** SHA-256 checksum of the payload */
  checksum: string;
  /** Optional expiration timestamp */
  expiresAt?: string;
  /** Optional tags for categorization */
  tags?: string[];
}
