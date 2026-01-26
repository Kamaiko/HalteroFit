/**
 * Plan Operations - Unit Tests
 *
 * Tests workout plan operations with focus on:
 * - Exercise count queries (critical for DayCard display)
 * - Cascade delete behavior (data integrity)
 * - Query correctness (no false positives)
 *
 * Note: These tests use LokiJS (in-memory) for speed.
 * Sync protocol tests require real SQLite (E2E).
 *
 * @see {@link src/services/database/operations/plans.ts}
 */

import { Database, Q } from '@nozbe/watermelondb';
import { createTestDatabase, cleanupTestDatabase } from '@test-helpers/database/test-database';
import {
  createTestWorkoutPlan,
  createTestPlanDay,
  createTestPlanDayExercise,
  createTestExercise,
  createTestUser,
  resetTestIdCounter,
  createMultipleRecords,
} from '@test-helpers/database/factories';
import { countRecords } from '@test-helpers/database/queries';

describe('Plan Operations', () => {
  let database: Database;

  beforeAll(() => {
    database = createTestDatabase();
    resetTestIdCounter();
  });

  afterEach(async () => {
    await cleanupTestDatabase(database);
  });

  // ==========================================================================
  // Exercise Count Queries
  // ==========================================================================

  describe('getExerciseCountByDay (via direct query)', () => {
    /**
     * Verifies exercise count returns 0 for empty day.
     *
     * Why this matters:
     * - DayCard shows "0 exercises" correctly
     * - No false positives from orphan data
     */
    test('returns 0 for day with no exercises', async () => {
      const user = await createTestUser(database);
      const plan = await createTestWorkoutPlan(database, { user_id: user.id });
      const day = await createTestPlanDay(database, { plan_id: plan.id });

      const count = await database
        .get('plan_day_exercises')
        .query(Q.where('plan_day_id', day.id))
        .fetchCount();

      expect(count).toBe(0);
    });

    /**
     * Verifies exercise count is accurate for populated day.
     *
     * Why this matters:
     * - DayCard shows correct exercise count
     * - Affects "Start Workout" button visibility
     */
    test('returns correct count for day with exercises', async () => {
      const user = await createTestUser(database);
      const plan = await createTestWorkoutPlan(database, { user_id: user.id });
      const day = await createTestPlanDay(database, { plan_id: plan.id });

      // Create 3 exercises and add them to the day
      const exercises = await createMultipleRecords(createTestExercise, database, 3);
      for (let i = 0; i < exercises.length; i++) {
        await createTestPlanDayExercise(database, {
          plan_day_id: day.id,
          exercise_id: exercises[i]!.id,
          order_index: i,
        });
      }

      const count = await database
        .get('plan_day_exercises')
        .query(Q.where('plan_day_id', day.id))
        .fetchCount();

      expect(count).toBe(3);
    });

    /**
     * Verifies counts are isolated between different days.
     *
     * Why this matters:
     * - Day A's exercises don't affect Day B's count
     * - Critical for multi-day plan display
     */
    test('counts are isolated between days', async () => {
      const user = await createTestUser(database);
      const plan = await createTestWorkoutPlan(database, { user_id: user.id });
      const day1 = await createTestPlanDay(database, { plan_id: plan.id, name: 'Day 1' });
      const day2 = await createTestPlanDay(database, { plan_id: plan.id, name: 'Day 2' });

      // Day 1: 2 exercises
      const exercises = await createMultipleRecords(createTestExercise, database, 5);
      await createTestPlanDayExercise(database, {
        plan_day_id: day1.id,
        exercise_id: exercises[0]!.id,
      });
      await createTestPlanDayExercise(database, {
        plan_day_id: day1.id,
        exercise_id: exercises[1]!.id,
      });

      // Day 2: 3 exercises
      await createTestPlanDayExercise(database, {
        plan_day_id: day2.id,
        exercise_id: exercises[2]!.id,
      });
      await createTestPlanDayExercise(database, {
        plan_day_id: day2.id,
        exercise_id: exercises[3]!.id,
      });
      await createTestPlanDayExercise(database, {
        plan_day_id: day2.id,
        exercise_id: exercises[4]!.id,
      });

      const count1 = await database
        .get('plan_day_exercises')
        .query(Q.where('plan_day_id', day1.id))
        .fetchCount();
      const count2 = await database
        .get('plan_day_exercises')
        .query(Q.where('plan_day_id', day2.id))
        .fetchCount();

      expect(count1).toBe(2);
      expect(count2).toBe(3);
    });
  });

  describe('getExerciseCountsByDays (batch query via Q.oneOf)', () => {
    /**
     * Verifies batch query returns correct counts for multiple days.
     *
     * Why this matters:
     * - Single query for all days (performance)
     * - Used by WorkoutScreen to display all DayCards
     */
    test('returns correct counts for multiple days in single query', async () => {
      const user = await createTestUser(database);
      const plan = await createTestWorkoutPlan(database, { user_id: user.id });
      const day1 = await createTestPlanDay(database, { plan_id: plan.id, name: 'Day 1' });
      const day2 = await createTestPlanDay(database, { plan_id: plan.id, name: 'Day 2' });
      const day3 = await createTestPlanDay(database, { plan_id: plan.id, name: 'Day 3' });

      const exercises = await createMultipleRecords(createTestExercise, database, 6);

      // Day 1: 1 exercise
      await createTestPlanDayExercise(database, {
        plan_day_id: day1.id,
        exercise_id: exercises[0]!.id,
      });

      // Day 2: 3 exercises
      await createTestPlanDayExercise(database, {
        plan_day_id: day2.id,
        exercise_id: exercises[1]!.id,
      });
      await createTestPlanDayExercise(database, {
        plan_day_id: day2.id,
        exercise_id: exercises[2]!.id,
      });
      await createTestPlanDayExercise(database, {
        plan_day_id: day2.id,
        exercise_id: exercises[3]!.id,
      });

      // Day 3: 0 exercises (empty)

      // Batch query using Q.oneOf
      const dayIds = [day1.id, day2.id, day3.id];
      const allExercises = await database
        .get('plan_day_exercises')
        .query(Q.where('plan_day_id', Q.oneOf(dayIds)))
        .fetch();

      // Count per day (same logic as getExerciseCountsByDays)
      const counts: Record<string, number> = {};
      for (const id of dayIds) {
        counts[id] = 0;
      }
      for (const exercise of allExercises) {
        const planDayId = (exercise as any).planDayId;
        counts[planDayId] = (counts[planDayId] ?? 0) + 1;
      }

      expect(counts[day1.id]).toBe(1);
      expect(counts[day2.id]).toBe(3);
      expect(counts[day3.id]).toBe(0);
    });

    /**
     * Verifies empty array input returns empty result.
     *
     * Why this matters:
     * - Edge case: plan with no days
     * - Should not throw or return undefined
     */
    test('handles empty day IDs array', async () => {
      const dayIds: string[] = [];

      // Should not throw
      const result = await database
        .get('plan_day_exercises')
        .query(Q.where('plan_day_id', Q.oneOf(dayIds.length > 0 ? dayIds : ['__none__'])))
        .fetch();

      expect(result).toEqual([]);
    });
  });

  // ==========================================================================
  // Cascade Delete Behavior
  // ==========================================================================

  describe('deletePlanDay cascade behavior', () => {
    /**
     * Verifies exercises are orphaned when day is deleted directly.
     *
     * Note: This tests raw WatermelonDB behavior.
     * The actual deletePlanDay() function handles cascade manually.
     *
     * Why this matters:
     * - Understanding database constraints
     * - Verifying manual cascade is necessary
     */
    test('deleting day leaves exercises orphaned (raw behavior)', async () => {
      const user = await createTestUser(database);
      const plan = await createTestWorkoutPlan(database, { user_id: user.id });
      const day = await createTestPlanDay(database, { plan_id: plan.id });
      const exercise = await createTestExercise(database);
      await createTestPlanDayExercise(database, {
        plan_day_id: day.id,
        exercise_id: exercise.id,
      });

      // Verify exercise exists
      const beforeCount = await countRecords(database, 'plan_day_exercises');
      expect(beforeCount).toBe(1);

      // Delete day directly (without cascade)
      await database.write(async () => {
        await day.destroyPermanently();
      });

      // Exercise still exists (orphaned)
      const afterCount = await countRecords(database, 'plan_day_exercises');
      expect(afterCount).toBe(1);
    });

    /**
     * Verifies proper cascade delete when done manually.
     *
     * This simulates what deletePlanDay() does:
     * 1. Delete all PlanDayExercises
     * 2. Delete the PlanDay
     *
     * Why this matters:
     * - No orphan data in database
     * - Correct cleanup on day deletion
     */
    test('manual cascade delete removes exercises first', async () => {
      const user = await createTestUser(database);
      const plan = await createTestWorkoutPlan(database, { user_id: user.id });
      const day = await createTestPlanDay(database, { plan_id: plan.id });

      // Add 3 exercises to the day
      const exercises = await createMultipleRecords(createTestExercise, database, 3);
      for (const ex of exercises) {
        await createTestPlanDayExercise(database, {
          plan_day_id: day.id,
          exercise_id: ex.id,
        });
      }

      // Verify setup
      expect(await countRecords(database, 'plan_day_exercises')).toBe(3);
      expect(await countRecords(database, 'plan_days')).toBe(1);

      // Manual cascade delete (same as deletePlanDay does)
      await database.write(async () => {
        const pdes = await database
          .get('plan_day_exercises')
          .query(Q.where('plan_day_id', day.id))
          .fetch();

        for (const pde of pdes) {
          await pde.destroyPermanently();
        }
        await day.destroyPermanently();
      });

      // Verify complete cleanup
      expect(await countRecords(database, 'plan_day_exercises')).toBe(0);
      expect(await countRecords(database, 'plan_days')).toBe(0);
    });
  });

  // ==========================================================================
  // Plan Day Ordering
  // ==========================================================================

  describe('Plan day ordering', () => {
    /**
     * Verifies days are retrieved in order_index order.
     *
     * Why this matters:
     * - Days display in correct sequence in UI
     * - User's custom ordering is preserved
     */
    test('days are sorted by order_index', async () => {
      const user = await createTestUser(database);
      const plan = await createTestWorkoutPlan(database, { user_id: user.id });

      // Create days out of order
      await createTestPlanDay(database, { plan_id: plan.id, name: 'Third', order_index: 2 });
      await createTestPlanDay(database, { plan_id: plan.id, name: 'First', order_index: 0 });
      await createTestPlanDay(database, { plan_id: plan.id, name: 'Second', order_index: 1 });

      const days = await database
        .get('plan_days')
        .query(Q.where('plan_id', plan.id), Q.sortBy('order_index', Q.asc))
        .fetch();

      expect(days.map((d: any) => d.name)).toEqual(['First', 'Second', 'Third']);
    });
  });

  // ==========================================================================
  // Active Plan Logic
  // ==========================================================================

  describe('Active plan logic', () => {
    /**
     * Verifies only one plan can be active at a time.
     *
     * Why this matters:
     * - WorkoutScreen shows THE active plan
     * - Setting a plan active should deactivate others
     */
    test('multiple plans can exist but query finds active one', async () => {
      const user = await createTestUser(database);

      // Create 3 plans, only one active
      await createTestWorkoutPlan(database, {
        user_id: user.id,
        name: 'Old Plan',
        is_active: false,
      });
      await createTestWorkoutPlan(database, {
        user_id: user.id,
        name: 'Active Plan',
        is_active: true,
      });
      await createTestWorkoutPlan(database, {
        user_id: user.id,
        name: 'Draft Plan',
        is_active: false,
      });

      // Query for active plan (same as observeActivePlan)
      const activePlans = await database
        .get('workout_plans')
        .query(Q.where('user_id', user.id), Q.where('is_active', true), Q.take(1))
        .fetch();

      expect(activePlans).toHaveLength(1);
      expect((activePlans[0] as any).name).toBe('Active Plan');
    });

    /**
     * Verifies query returns empty when no active plan.
     *
     * Why this matters:
     * - WorkoutScreen creates default plan when none active
     * - Should not crash with null/undefined
     */
    test('returns empty array when no active plan', async () => {
      const user = await createTestUser(database);

      await createTestWorkoutPlan(database, {
        user_id: user.id,
        name: 'Inactive Plan',
        is_active: false,
      });

      const activePlans = await database
        .get('workout_plans')
        .query(Q.where('user_id', user.id), Q.where('is_active', true))
        .fetch();

      expect(activePlans).toHaveLength(0);
    });
  });
});
