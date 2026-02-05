/**
 * Auth Validation Utilities for Database Operations
 *
 * Centralizes the repeated auth check pattern used in every write operation.
 * Every function that modifies data calls requireAuth() first.
 *
 * USAGE:
 * const currentUser = requireAuth('create workout plans');
 */

import { useAuthStore } from '@/stores/auth/authStore';
import { AuthError } from '@/utils/errors';

/**
 * Require an authenticated user. Throws AuthError if not signed in.
 *
 * @param action - Human-readable action description for the error message
 * @returns The authenticated user with a guaranteed non-null id
 * @throws {AuthError} If no user is authenticated
 */
export function requireAuth(action: string): { id: string } {
  const currentUser = useAuthStore.getState().user;
  if (!currentUser?.id) {
    throw new AuthError(
      `Please sign in to ${action}`,
      'User not authenticated - no user.id in authStore'
    );
  }
  return currentUser as { id: string };
}

/**
 * Validate that a provided user_id matches the current user.
 * Used for operations where the caller passes a user_id in the data payload.
 *
 * @param providedUserId - The user ID from the request data
 * @param currentUserId - The authenticated user's ID
 * @throws {AuthError} If the IDs don't match
 */
export function validateUserIdMatch(providedUserId: string, currentUserId: string): void {
  if (providedUserId !== currentUserId) {
    throw new AuthError(
      'Authentication error. Please sign out and sign in again.',
      `User ID mismatch - Expected: ${currentUserId}, Received: ${providedUserId}`
    );
  }
}

/**
 * Validate that the current user owns a resource.
 * Used inside database.write() blocks after fetching the resource.
 *
 * @param resourceUserId - The owner's user ID on the resource
 * @param currentUserId - The authenticated user's ID
 * @param action - Human-readable description of the action being attempted
 * @throws {AuthError} If the user doesn't own the resource
 */
export function validateOwnership(
  resourceUserId: string,
  currentUserId: string,
  action: string
): void {
  if (resourceUserId !== currentUserId) {
    throw new AuthError(
      `You do not have permission to ${action}`,
      `User ${currentUserId} attempted to ${action} on resource owned by ${resourceUserId}`
    );
  }
}
