/**
 * Error Handling Examples
 *
 * This file demonstrates how to use the error handling system
 * throughout the application.
 *
 * NOTE: This is a documentation file, not automated tests.
 * For automated tests, see actual .test.ts files.
 */

/* eslint-disable no-console */
// Console.log is intentional in this example file for demonstration purposes

import { useAuthStore } from '@/stores/auth/authStore';
import { createWorkout, getWorkoutById } from '@/services/database/operations/workouts';
import { AuthError, DatabaseError } from '@/utils/errors';
import { useErrorHandler } from '@/hooks/ui/useErrorHandler';

// ============================================================================
// Example 1: User Not Authenticated
// ============================================================================

async function example1_UserNotAuthenticated() {
  console.log('\n=== Example 1: User Not Authenticated ===');

  // Setup: Sign out user
  useAuthStore.getState().signOut();

  // Try to create workout without authentication
  try {
    await createWorkout({
      user_id: 'test-user-id',
      started_at: Date.now(),
    });

    console.log('❌ ERROR: Should have thrown AuthError');
  } catch (error) {
    if (error instanceof AuthError) {
      console.log('✅ SUCCESS: AuthError thrown correctly');
      console.log('   User Message:', error.userMessage);
      console.log('   Developer Message:', error.developerMessage);
      console.log('   Code:', error.code);
      console.log('   Status:', error.statusCode);

      // Expected output:
      // User Message: "Please sign in to create workouts"
      // Developer Message: "User not authenticated - no user.id in authStore"
      // Code: "AUTH_ERROR"
      // Status: 401
    } else {
      console.log('❌ ERROR: Wrong error type thrown');
    }
  }
}

// ============================================================================
// Example 2: User ID Mismatch (Security Violation)
// ============================================================================

async function example2_UserIdMismatch() {
  console.log('\n=== Example 2: User ID Mismatch ===');

  // Setup: Sign in as user-123
  useAuthStore.getState().setUser({
    id: 'user-123',
    email: 'test@example.com',
  });

  // Try to create workout for different user (security violation)
  try {
    await createWorkout({
      user_id: 'user-456', // Different user!
      started_at: Date.now(),
    });

    console.log('❌ ERROR: Should have thrown AuthError');
  } catch (error) {
    if (error instanceof AuthError) {
      console.log('✅ SUCCESS: AuthError thrown correctly');
      console.log('   User Message:', error.userMessage);
      console.log('   Developer Message:', error.developerMessage);

      // Expected output:
      // User Message: "Authentication error. Please sign out and sign in again."
      // Developer Message: "User ID mismatch - Expected: user-123, Received: user-456"
    } else {
      console.log('❌ ERROR: Wrong error type thrown');
    }
  }
}

// ============================================================================
// Example 3: Invalid Database ID (Not Found)
// ============================================================================

async function example3_InvalidDatabaseId() {
  console.log('\n=== Example 3: Invalid Database ID ===');

  // Setup: Sign in user
  useAuthStore.getState().setUser({
    id: 'user-123',
    email: 'test@example.com',
  });

  // Try to get workout with invalid ID
  try {
    await getWorkoutById('invalid-id-that-does-not-exist');

    console.log('❌ ERROR: Should have thrown DatabaseError');
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.log('✅ SUCCESS: DatabaseError thrown correctly');
      console.log('   User Message:', error.userMessage);
      console.log('   Developer Message:', error.developerMessage);

      // Expected output:
      // User Message: "Unable to load workout. Please try again."
      // Developer Message: "Failed to get workout by ID invalid-id-that-does-not-exist: <actual error>"
    } else {
      console.log('❌ ERROR: Wrong error type thrown');
    }
  }
}

// ============================================================================
// Example 4: Success Case (No Errors)
// ============================================================================

async function example4_SuccessCase() {
  console.log('\n=== Example 4: Success Case ===');

  // Setup: Sign in user
  const userId = 'user-123';
  useAuthStore.getState().setUser({
    id: userId,
    email: 'test@example.com',
  });

  // Create workout successfully
  try {
    const workout = await createWorkout({
      user_id: userId, // Correct user ID
      started_at: Date.now(),
      title: 'Push Day A',
    });

    console.log('✅ SUCCESS: Workout created');
    console.log('   Workout ID:', workout.id);
    console.log('   User ID:', workout.user_id);
    console.log('   Title:', workout.title);
  } catch (error) {
    console.log('❌ ERROR: Unexpected error:', error);
  }
}

// ============================================================================
// Example 5: Using useErrorHandler Hook in Components
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Example5_ComponentUsage() {
  const { handleError } = useErrorHandler();

  const handleCreateWorkout = async () => {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        throw new AuthError(
          'Please sign in to create workouts',
          'User not authenticated - no user.id in authStore'
        );
      }

      const workout = await createWorkout({
        user_id: userId,
        started_at: Date.now(),
      });

      console.log('Workout created:', workout);
    } catch (error) {
      // handleError will:
      // 1. Show user-friendly Alert
      // 2. Log detailed error to console
      // 3. Send to Sentry (when configured in task 0.5.5)
      handleError(error, 'handleCreateWorkout');
    }
  };

  return { handleCreateWorkout };
}

// ============================================================================
// How to Run These Examples
// ============================================================================

export async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       Error Handling System - Usage Examples          ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  await example1_UserNotAuthenticated();
  await example2_UserIdMismatch();
  await example3_InvalidDatabaseId();
  await example4_SuccessCase();

  console.log('\n✅ All examples completed!');
  console.log('\nTo use in components:');
  console.log('  const { handleError } = useErrorHandler();');
  console.log('  try { ... } catch (error) { handleError(error, "context"); }');
}

// Uncomment to run examples:
// runAllExamples();
