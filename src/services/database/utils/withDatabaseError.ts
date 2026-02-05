/**
 * Database Error Handling Wrapper
 *
 * Eliminates the repeated try/catch pattern in every database operation.
 * Catches unexpected errors and wraps them in a user-friendly DatabaseError,
 * while re-throwing known error types (AuthError, DatabaseError, ValidationError).
 *
 * USAGE:
 * export async function createPlan(data: CreatePlan): Promise<WorkoutPlan> {
 *   return withDatabaseError(
 *     async () => { ... },
 *     'Unable to create workout plan. Please try again.',
 *     'Failed to create plan'
 *   );
 * }
 */

import { AuthError, DatabaseError, ValidationError } from '@/utils/errors';

/**
 * Wrap a database operation with standardized error handling.
 *
 * - Re-throws AuthError, DatabaseError, and ValidationError as-is
 * - Wraps any other error in a new DatabaseError with user-friendly message
 *
 * @param operation - The async database operation to execute
 * @param userMessage - User-friendly error message (shown in UI)
 * @param context - Technical context for developer logging
 */
export async function withDatabaseError<T>(
  operation: () => Promise<T>,
  userMessage: string,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (
      error instanceof AuthError ||
      error instanceof DatabaseError ||
      error instanceof ValidationError
    ) {
      throw error;
    }

    throw new DatabaseError(
      userMessage,
      `${context}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
