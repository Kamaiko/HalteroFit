/**
 * Plan Validation Utilities
 *
 * Centralized validation for workout plans and days.
 * Used by both database operations (throw errors) and UI hooks (show alerts).
 *
 * USAGE:
 * // In database operations (throws on failure):
 * validateDayName(name, dayId);
 *
 * // In hooks (check result for alerts):
 * const error = getDayCountError(currentCount);
 * if (error) { setAlert(error); return; }
 */

import { MAX_DAYS_PER_PLAN, MAX_DAY_NAME_LENGTH, MAX_PLAN_NAME_LENGTH } from '@/constants';
import { ValidationError } from '@/utils/errors';

// ============================================================================
// Result-based validators (for hooks that show alerts)
// ============================================================================

/**
 * Check if adding days would exceed the plan limit.
 * Returns an error object suitable for alert dialogs, or null if valid.
 */
export function getDayCountError(
  currentCount: number
): { title: string; description: string } | null {
  if (currentCount >= MAX_DAYS_PER_PLAN) {
    return {
      title: 'Day Limit Reached',
      description: `This plan already has ${MAX_DAYS_PER_PLAN} days (maximum allowed).`,
    };
  }
  return null;
}

// ============================================================================
// Throwing validators (for database operations)
// ============================================================================

/**
 * Validate a plan name. Throws ValidationError on failure.
 *
 * @param name - The plan name to validate
 * @param context - Resource identifier for developer logging (e.g., plan ID)
 * @throws {ValidationError} If name is empty or exceeds max length
 */
export function validatePlanName(name: string, context: string): void {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(
      'Plan name cannot be empty',
      `Attempted to save ${context} with empty name`
    );
  }
  if (trimmed.length > MAX_PLAN_NAME_LENGTH) {
    throw new ValidationError(
      `Plan name cannot exceed ${MAX_PLAN_NAME_LENGTH} characters`,
      `Attempted to save ${context} with name length ${trimmed.length}`
    );
  }
}

/**
 * Validate a day name. Throws ValidationError on failure.
 *
 * @param name - The day name to validate
 * @param context - Resource identifier for developer logging (e.g., day ID)
 * @throws {ValidationError} If name is empty or exceeds max length
 */
export function validateDayName(name: string, context: string): void {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(
      'Day name cannot be empty',
      `Attempted to save ${context} with empty name`
    );
  }
  if (trimmed.length > MAX_DAY_NAME_LENGTH) {
    throw new ValidationError(
      `Day name cannot exceed ${MAX_DAY_NAME_LENGTH} characters`,
      `Attempted to save ${context} with name length ${trimmed.length}`
    );
  }
}
