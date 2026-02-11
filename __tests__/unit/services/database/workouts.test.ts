/**
 * Workout CRUD Operations - Unit Tests
 *
 * Tests all workout CRUD operations with focus on:
 * - Basic CRUD functionality
 * - Sync protocol compliance (_changed, _status)
 * - Authentication validation
 * - Error handling
 * - Data integrity
 *
 * @see {@link src/services/database/workouts.ts}
 */

import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { createTestDatabase, cleanupTestDatabase } from '@test-helpers/database/test-database';
import Workout from '@/services/database/local/models/Workout';
import {
  createTestWorkout,
  createTestUser,
  resetTestIdCounter,
  createMultipleRecords,
} from '@test-helpers/database/factories';
import { getAllRecords, countRecords } from '@test-helpers/database/queries';
import { wait, dateInPast } from '@test-helpers/database/time';
import { assertDatesApproximatelyEqual } from '@test-helpers/database/assertions';

// NOTE: Sync protocol tests (assertSyncProtocolColumns, getSyncTimestamp)
// removed - these require real SQLite and are tested in E2E only.
// See: docs/TESTING.md for testing strategy

describe('Workout CRUD Operations', () => {
  let database: Database;

  beforeAll(() => {
    database = createTestDatabase();
    resetTestIdCounter();
  });

  afterEach(async () => {
    await cleanupTestDatabase(database);
  });

  // ==========================================================================
  // CREATE Operations
  // ==========================================================================

  describe('createWorkout', () => {
    /**
     * Verifies basic workout creation with required fields.
     *
     * Tests:
     * - Workout created with correct user_id
     * - Title saved correctly
     * - Status set to default ('in_progress')
     * - Timestamps auto-generated
     */
    test('creates workout with required fields', async () => {
      const user = await createTestUser(database);
      const workout = await createTestWorkout(database, {
        user_id: user.id,
        title: 'Push Day',
      });

      expect(workout.userId).toBe(user.id);
      expect(workout.title).toBe('Push Day');
      expect(workout.isActive).toBe(true); // New workouts are active (completed_at is null)
      expect(workout.createdAt).toBeDefined();
      expect(workout.updatedAt).toBeDefined();
    });

    /**
     * Verifies workout creation with all optional fields.
     *
     * Tests:
     * - Optional fields (notes, etc.) saved correctly
     * - Nullable fields handled properly
     * - Duration calculated correctly
     */
    test('creates workout with optional fields', async () => {
      const user = await createTestUser(database);
      const startedAt = dateInPast({ hours: 2 });
      const completedAt = dateInPast({ hours: 1 });

      const workout = await createTestWorkout(database, {
        user_id: user.id,
        title: 'Full Body',
        notes: 'Great session, felt strong',
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
        duration_seconds: 3600,
      });

      expect(workout.title).toBe('Full Body');
      expect(workout.notes).toBe('Great session, felt strong');
      expect(workout.isActive).toBe(false); // Completed workouts are not active
      expect(workout.durationSeconds).toBe(3600);

      assertDatesApproximatelyEqual(workout.startedAt, startedAt, 1000);
      assertDatesApproximatelyEqual(workout.completedAt!, completedAt, 1000);
    });

    // NOTE: Test "creates workout with sync protocol columns" removed
    // Sync protocol testing requires real SQLite - moved to E2E tests
    // See: docs/TESTING.md

    /**
     * Verifies created_at and updated_at are set and equal on creation.
     *
     * Tests:
     * - Both timestamps generated
     * - Timestamps are approximately equal on creation
     * - Timestamps are reasonable (recent)
     */
    test('sets created_at and updated_at on creation', async () => {
      const before = new Date();
      const workout = await createTestWorkout(database);
      const after = new Date();

      expect(workout.createdAt).toBeDefined();
      expect(workout.updatedAt).toBeDefined();

      // created_at and updated_at should be equal on creation
      expect(workout.createdAt.getTime()).toBe(workout.updatedAt.getTime());

      // Should be between before and after
      expect(workout.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(workout.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // ==========================================================================
  // READ Operations
  // ==========================================================================

  describe('readWorkout', () => {
    /**
     * Verifies single workout can be fetched by ID.
     *
     * Tests:
     * - Workout found by ID
     * - All fields match created data
     */
    test('reads single workout by ID', async () => {
      const workout = await createTestWorkout(database, {
        title: 'Leg Day',
      });

      const collection = database.get('workouts');
      const found = (await collection.find(workout.id)) as Workout;

      expect(found.id).toBe(workout.id);
      expect(found.title).toBe('Leg Day');
    });

    /**
     * Verifies all workouts can be fetched.
     *
     * Tests:
     * - Query returns all workouts
     * - Count matches created count
     */
    test('reads all workouts', async () => {
      await createMultipleRecords(createTestWorkout, database, 5);

      const workouts = await getAllRecords(database, 'workouts');

      expect(workouts).toHaveLength(5);
    });

    /**
     * Verifies workouts can be filtered by user_id.
     *
     * Tests:
     * - Query with WHERE clause works
     * - Returns only matching workouts
     * - Other users' workouts excluded
     */
    test('reads workouts by user_id', async () => {
      const user1 = await createTestUser(database, { email: 'user1@example.com' });
      const user2 = await createTestUser(database, { email: 'user2@example.com' });

      await createMultipleRecords(createTestWorkout, database, 3, (i) => ({
        user_id: user1.id,
        title: `User1 Workout ${i + 1}`,
      }));

      await createMultipleRecords(createTestWorkout, database, 2, (i) => ({
        user_id: user2.id,
        title: `User2 Workout ${i + 1}`,
      }));

      const user1Workouts = await database
        .get('workouts')
        .query(Q.where('user_id', user1.id))
        .fetch();

      expect(user1Workouts).toHaveLength(3);
      user1Workouts.forEach((workout: any) => {
        expect(workout.userId).toBe(user1.id);
      });
    });

    /**
     * Verifies workouts can be filtered by completion status.
     *
     * Tests:
     * - Query for active workouts (completed_at is null)
     * - Returns only active workouts
     */
    test('reads workouts by status', async () => {
      // Active workouts (completed_at is null)
      await createTestWorkout(database, { title: 'Workout 1', completed_at: null });
      await createTestWorkout(database, { title: 'Workout 2', completed_at: null });
      // Completed workouts (completed_at is set)
      await createTestWorkout(database, {
        title: 'Workout 3',
        completed_at: new Date().toISOString(),
      });
      await createTestWorkout(database, {
        title: 'Workout 4',
        completed_at: new Date().toISOString(),
      });

      const inProgress = await database
        .get('workouts')
        .query(Q.where('completed_at', null))
        .fetch();

      expect(inProgress).toHaveLength(2);
    });

    /**
     * Verifies workouts can be sorted.
     *
     * Tests:
     * - Sort by started_at descending (most recent first)
     * - Order is correct
     */
    test('reads workouts sorted by started_at', async () => {
      const workout1 = await createTestWorkout(database, {
        title: 'Oldest',
        started_at: dateInPast({ days: 3 }).toISOString(),
      });

      const workout2 = await createTestWorkout(database, {
        title: 'Middle',
        started_at: dateInPast({ days: 2 }).toISOString(),
      });

      const workout3 = await createTestWorkout(database, {
        title: 'Newest',
        started_at: dateInPast({ days: 1 }).toISOString(),
      });

      const workouts = (await database
        .get('workouts')
        .query(Q.sortBy('started_at', Q.desc))
        .fetch()) as Workout[];

      expect(workouts[0]?.id).toBe(workout3.id); // Newest first
      expect(workouts[1]?.id).toBe(workout2.id);
      expect(workouts[2]?.id).toBe(workout1.id);
    });
  });

  // ==========================================================================
  // UPDATE Operations
  // ==========================================================================

  describe('updateWorkout', () => {
    /**
     * Verifies workout fields can be updated.
     *
     * Tests:
     * - Title updated correctly
     * - Other fields remain unchanged
     */
    test('updates workout title', async () => {
      const workout = await createTestWorkout(database, {
        title: 'Original Title',
      });

      await database.write(async () => {
        await workout.update((w: any) => {
          w.title = 'Updated Title';
        });
      });

      const updated = (await database.get('workouts').find(workout.id)) as Workout;
      expect(updated.title).toBe('Updated Title');
    });

    /**
     * Verifies multiple fields can be updated in single operation.
     *
     * Tests:
     * - Multiple fields updated atomically
     * - All changes persisted correctly
     */
    test('updates multiple workout fields', async () => {
      const workout = await createTestWorkout(database, {
        title: 'Workout',
        notes: null,
      });

      await database.write(async () => {
        await workout.update((w: any) => {
          w.title = 'Completed Workout';
          w.completedAt = new Date(); // Mark as completed
          w.notes = 'Great session';
          w.durationSeconds = 3600;
        });
      });

      const updated = (await database.get('workouts').find(workout.id)) as Workout;
      expect(updated.title).toBe('Completed Workout');
      expect(updated.isActive).toBe(false); // Completed workouts are not active
      expect(updated.notes).toBe('Great session');
      expect(updated.durationSeconds).toBe(3600);
    });

    /**
     * Verifies _changed timestamp updates on modification.
     *
     * Tests:
     * - _changed increments on update
     * - New timestamp > old timestamp
     * - Sync protocol working correctly
     */
    // NOTE: Test "updates _changed timestamp on modification" removed
    // Sync protocol testing requires real SQLite - moved to E2E tests

    /**
     * Verifies updated_at timestamp updates on modification.
     *
     * Tests:
     * - updated_at increments
     * - created_at remains unchanged
     */
    test('updates updated_at but not created_at', async () => {
      const workout = await createTestWorkout(database);
      const originalCreatedAt = workout.createdAt.getTime();

      await wait(10);

      await database.write(async () => {
        await workout.update((w: any) => {
          w.title = 'Updated';
        });
      });

      const updated = (await database.get('workouts').find(workout.id)) as Workout;

      expect(updated.createdAt.getTime()).toBe(originalCreatedAt); // Unchanged
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalCreatedAt); // Updated
    });
  });

  // ==========================================================================
  // DELETE Operations (Soft Delete)
  // ==========================================================================

  describe('deleteWorkout', () => {
    /**
     * Verifies workout can be soft deleted.
     *
     * Tests:
     * - markAsDeleted() sets _status to 'deleted'
     * - Record still exists in database
     * - _changed timestamp updated
     */
    // NOTE: Tests "soft deletes workout" and "excludes soft deleted workouts from queries" removed
    // These tests query _status column which doesn't exist in LokiJS adapter
    // Sync protocol testing requires real SQLite - moved to E2E tests

    /**
     * Verifies hard delete (permanent deletion).
     *
     * Tests:
     * - destroyPermanently() removes record from database
     * - Record cannot be found after deletion
     */
    test('hard deletes workout permanently', async () => {
      const workout = await createTestWorkout(database);

      await database.write(async () => {
        await workout.destroyPermanently();
      });

      const count = await countRecords(database, 'workouts');
      expect(count).toBe(0);

      await expect(database.get('workouts').find(workout.id)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // Complex Queries
  // ==========================================================================

  describe('complexQueries', () => {
    /**
     * Verifies complex multi-condition queries.
     *
     * Tests:
     * - Multiple WHERE conditions (AND logic)
     * - Sorting combined with filtering
     */
    test('queries workouts with multiple conditions', async () => {
      const user = await createTestUser(database);

      await createTestWorkout(database, {
        user_id: user.id,
        completed_at: new Date().toISOString(),
        title: 'Workout 1',
      });

      await createTestWorkout(database, {
        user_id: user.id,
        completed_at: new Date().toISOString(),
        title: 'Workout 2',
      });

      await createTestWorkout(database, {
        user_id: user.id,
        completed_at: null,
        title: 'Workout 3',
      });

      // Query: user's completed workouts
      const workouts = await database
        .get('workouts')
        .query(Q.where('user_id', user.id), Q.where('completed_at', Q.notEq(null)))
        .fetch();

      expect(workouts).toHaveLength(2);
      const titles = workouts.map((w: any) => w.title).sort();
      expect(titles).toEqual(['Workout 1', 'Workout 2']);
    });

    /**
     * Verifies pagination with skip and take.
     *
     * Tests:
     * - Skip first N records
     * - Take only M records
     * - Pagination works correctly
     */
    test('paginates workout results', async () => {
      // Create 10 workouts
      await createMultipleRecords(createTestWorkout, database, 10, (i) => ({
        title: `Workout ${i + 1}`,
        started_at: dateInPast({ days: 10 - i }).toISOString(),
      }));

      // Get second page (skip 5, take 3)
      const page2 = await database
        .get('workouts')
        .query(Q.sortBy('started_at', Q.desc), Q.skip(5), Q.take(3))
        .fetch();

      expect(page2).toHaveLength(3);
      expect((page2[0] as any).title).toBe('Workout 5');
      expect((page2[1] as any).title).toBe('Workout 4');
      expect((page2[2] as any).title).toBe('Workout 3');
    });
  });

  // ==========================================================================
  // Batch Operations Tests
  // ==========================================================================

  describe('batchOperations', () => {
    /**
     * Verifies database handles multiple workouts efficiently.
     *
     * Tests:
     * - Create 100 workouts in batch
     * - Query returns all records correctly
     * - Database handles moderate volumes
     *
     * NOTE: Performance assertions removed (LokiJS ≠ SQLite real device).
     * For real device performance testing, use Maestro E2E tests.
     */
    test('queries multiple workouts efficiently', async () => {
      // Create 100 workouts (realistic dataset for unit tests)
      await createMultipleRecords(createTestWorkout, database, 100);

      const workouts = await database.get('workouts').query().fetch();

      expect(workouts).toHaveLength(100);
    });

    /**
     * Verifies filtered queries work correctly with multiple records.
     *
     * Tests:
     * - Indexed column query (user_id) returns correct results
     * - Multiple WHERE clauses work together
     * - Query handles mixed data (completed + in-progress)
     *
     * NOTE: Performance assertions removed (LokiJS ≠ SQLite real device).
     */
    test('filters multiple workouts by user and status', async () => {
      const user = await createTestUser(database);

      // Create 100 workouts for user (mix completed + in-progress)
      await createMultipleRecords(createTestWorkout, database, 100, () => ({
        user_id: user.id,
        completed_at: Math.random() > 0.5 ? new Date().toISOString() : null,
      }));

      const completedWorkouts = await database
        .get('workouts')
        .query(Q.where('user_id', user.id), Q.where('completed_at', Q.notEq(null)))
        .fetch();

      expect(completedWorkouts.length).toBeGreaterThan(0);
      expect(completedWorkouts.length).toBeLessThan(100); // Should be ~50% (random)
      completedWorkouts.forEach((workout: any) => {
        expect(workout.userId).toBe(user.id);
        expect(workout.completedAt).toBeTruthy();
      });
    });
  });
});
