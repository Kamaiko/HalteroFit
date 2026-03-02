/**
 * Error Handling System
 *
 * Two-tier error messages:
 * - userMessage: Simple, actionable (shown in Alert to users)
 * - developerMessage: Detailed, technical (logged to console/Sentry)
 *
 * Usage:
 * throw new DatabaseError(
 *   'Unable to save workout. Please try again.',
 *   'Failed to create workout: user_id is null'
 * );
 */

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  constructor(
    public userMessage: string,
    public developerMessage: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(developerMessage); // Error.message = developerMessage for logging
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize error for logging (Sentry, etc.)
   */
  toJSON() {
    return {
      name: this.name,
      userMessage: this.userMessage,
      developerMessage: this.developerMessage,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      stack: this.stack,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Database operation errors (CRUD, queries, etc.)
 * Status: 500 Internal Server Error
 */
export class DatabaseError extends AppError {
  constructor(userMessage: string, developerMessage: string, code: string = 'DATABASE_ERROR') {
    super(userMessage, developerMessage, code, 500);
  }
}

/**
 * Authentication and authorization errors
 * Status: 401 Unauthorized
 */
export class AuthError extends AppError {
  constructor(userMessage: string, developerMessage: string, code: string = 'AUTH_ERROR') {
    super(userMessage, developerMessage, code, 401);
  }
}

/**
 * Data validation errors (invalid input, constraints, etc.)
 * Status: 400 Bad Request
 */
export class ValidationError extends AppError {
  constructor(userMessage: string, developerMessage: string, code: string = 'VALIDATION_ERROR') {
    super(userMessage, developerMessage, code, 400);
  }
}

/**
 * Synchronization errors (Supabase sync, network, etc.)
 * Status: 503 Service Unavailable
 *
 * @param isRetryable - Flag for retry logic (task 0.5.27)
 */
export class SyncError extends AppError {
  constructor(
    userMessage: string,
    developerMessage: string,
    public isRetryable: boolean = true,
    code: string = 'SYNC_ERROR'
  ) {
    super(userMessage, developerMessage, code, 503);
  }
}

/**
 * Type guard to check if an error is operational (safe to show to users)
 *
 * @param error - Error to check
 * @returns true if error is an operational AppError
 */
export function isOperationalError(error: unknown): error is AppError {
  return error instanceof AppError && error.isOperational;
}
