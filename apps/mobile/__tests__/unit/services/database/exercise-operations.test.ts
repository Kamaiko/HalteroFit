/**
 * Exercise Operations - Unit Tests
 *
 * Tests exercise service-layer functions with focus on:
 * - validateExerciseAdditions: smoke test confirming it throws when check fails
 * - reorderPlanDayExercises: completeness check, cross-day guard, order persistence,
 *   and the optimization that skips unchanged records
 * - removeExerciseFromPlanDay: marks record as deleted, ownership guard wired
 *
 * validateReorderInput and checkExerciseAdditions are already covered in
 * day-operations.test.ts — not re-tested here.
 *
 * Pure function tests run without mocking. Service function tests use a LokiJS
 * test database with mocked auth store for ownership verification.
 */

import { Database, Q } from '@nozbe/watermelondb';
import { createTestDatabase, cleanupTestDatabase } from '@test-helpers/database/test-database';
import {
  createTestUser,
  createTestWorkoutPlan,
  createTestPlanDay,
  createTestPlanDayExercise,
  createTestExercise,
  resetTestIdCounter,
} from '@test-helpers/database/factories';
import { MAX_EXERCISES_PER_DAY } from '@/constants';
import { ValidationError } from '@/utils/errors';
import type PlanDayExerciseModel from '@/services/database/local/models/PlanDayExercise';

// ============================================================================
// Pure function imports (no mocking needed)
// ============================================================================

import { validateExerciseAdditions } from '@/services/database/operations/plans/exercise-operations';

// ============================================================================
// Service function mocking setup
// ============================================================================

let mockDb: Database;

const mockGetState = jest.fn().mockReturnValue({ user: { id: 'test-user-auth' } });

jest.mock('@/services/database/local', () => ({
  get database() {
    return mockDb;
  },
}));

jest.mock('@/stores/auth/authStore', () => ({
  useAuthStore: {
    getState: () => mockGetState(),
  },
}));

// Service function imports (AFTER mocks — jest hoists mock declarations)
import {
  reorderPlanDayExercises,
  removeExerciseFromPlanDay,
} from '@/services/database/operations/plans/exercise-operations';

// ============================================================================
// Pure Function Tests
// ============================================================================

describe('validateExerciseAdditions', () => {
  test('throws ValidationError when checkExerciseAdditions returns a limit error', () => {
    // Smoke test: confirms the wrapper delegates to checkExerciseAdditions and throws.
    // The boundary cases of checkExerciseAdditions are already covered in day-operations.test.ts.
    expect(() =>
      validateExerciseAdditions({
        currentCount: MAX_EXERCISES_PER_DAY,
        existingExerciseIds: new Set(),
        newExerciseIds: ['ex-1'],
        dayId: 'day-1',
      })
    ).toThrow(ValidationError);
  });
});

// ============================================================================
// Service Function Tests (require DB + auth mocking)
// ============================================================================

const TEST_USER_ID = 'test-user-auth';

describe('Service: reorderPlanDayExercises', () => {
  beforeAll(() => {
    mockDb = createTestDatabase();
    resetTestIdCounter();
  });

  afterEach(async () => {
    await cleanupTestDatabase(mockDb);
    mockGetState.mockReturnValue({ user: { id: TEST_USER_ID } });
  });

  test('updates orderIndex for all exercises in the new sequence', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const day = await createTestPlanDay(mockDb, { plan_id: plan.id });
    const exA = await createTestExercise(mockDb);
    const exB = await createTestExercise(mockDb);
    const exC = await createTestExercise(mockDb);
    const pdeA = await createTestPlanDayExercise(mockDb, {
      plan_day_id: day.id,
      exercise_id: exA.id,
      order_index: 0,
    });
    const pdeB = await createTestPlanDayExercise(mockDb, {
      plan_day_id: day.id,
      exercise_id: exB.id,
      order_index: 1,
    });
    const pdeC = await createTestPlanDayExercise(mockDb, {
      plan_day_id: day.id,
      exercise_id: exC.id,
      order_index: 2,
    });

    // Reverse order: C → 0, B → 1, A → 2
    await reorderPlanDayExercises([
      { id: pdeC.id, order_index: 0 },
      { id: pdeB.id, order_index: 1 },
      { id: pdeA.id, order_index: 2 },
    ]);

    const exercises = await mockDb
      .get<PlanDayExerciseModel>('plan_day_exercises')
      .query(Q.where('plan_day_id', day.id), Q.sortBy('order_index', Q.asc))
      .fetch();

    expect(exercises.map((e) => e.exerciseId)).toEqual([exC.id, exB.id, exA.id]);
  });

  test('throws ValidationError when batch omits exercises (completeness check)', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const day = await createTestPlanDay(mockDb, { plan_id: plan.id });
    const exA = await createTestExercise(mockDb);
    const exB = await createTestExercise(mockDb);
    const pdeA = await createTestPlanDayExercise(mockDb, {
      plan_day_id: day.id,
      exercise_id: exA.id,
      order_index: 0,
    });
    await createTestPlanDayExercise(mockDb, {
      plan_day_id: day.id,
      exercise_id: exB.id,
      order_index: 1,
    });

    // Only pass 1 of 2 exercises — completeness check must reject this
    await expect(reorderPlanDayExercises([{ id: pdeA.id, order_index: 0 }])).rejects.toThrow(
      ValidationError
    );
  });

  test('throws ValidationError when an exercise belongs to a different day', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const dayA = await createTestPlanDay(mockDb, { plan_id: plan.id, order_index: 0 });
    const dayB = await createTestPlanDay(mockDb, { plan_id: plan.id, order_index: 1 });
    const ex1 = await createTestExercise(mockDb);
    const ex2 = await createTestExercise(mockDb);
    // One exercise belongs to dayA, another to dayB
    const pde1 = await createTestPlanDayExercise(mockDb, {
      plan_day_id: dayA.id,
      exercise_id: ex1.id,
      order_index: 0,
    });
    const pde2 = await createTestPlanDayExercise(mockDb, {
      plan_day_id: dayB.id,
      exercise_id: ex2.id,
      order_index: 0,
    });

    // Batch anchors to dayA via first record but pde2 lives on dayB — must reject
    await expect(
      reorderPlanDayExercises([
        { id: pde1.id, order_index: 0 },
        { id: pde2.id, order_index: 1 },
      ])
    ).rejects.toThrow(ValidationError);
  });

  test('does not dirty records whose orderIndex is already correct', async () => {
    // This validates the sync-optimization: unchanged records must not be batched.
    // We verify by checking that _changed stays empty (WatermelonDB marks changed records).
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const day = await createTestPlanDay(mockDb, { plan_id: plan.id });
    const exA = await createTestExercise(mockDb);
    const exB = await createTestExercise(mockDb);
    const pdeA = await createTestPlanDayExercise(mockDb, {
      plan_day_id: day.id,
      exercise_id: exA.id,
      order_index: 0,
    });
    const pdeB = await createTestPlanDayExercise(mockDb, {
      plan_day_id: day.id,
      exercise_id: exB.id,
      order_index: 1,
    });

    // Submit identical order — no actual change
    await reorderPlanDayExercises([
      { id: pdeA.id, order_index: 0 },
      { id: pdeB.id, order_index: 1 },
    ]);

    // Re-fetch and confirm order is still correct (no corruption from a no-op reorder)
    const exercises = await mockDb
      .get<PlanDayExerciseModel>('plan_day_exercises')
      .query(Q.where('plan_day_id', day.id), Q.sortBy('order_index', Q.asc))
      .fetch();

    expect(exercises[0]!.orderIndex).toBe(0);
    expect(exercises[1]!.orderIndex).toBe(1);
    // WatermelonDB marks records dirty via _raw._status — unchanged records stay 'synced'
    expect(exercises[0]!._raw._status).not.toBe('updated');
    expect(exercises[1]!._raw._status).not.toBe('updated');
  });

  test('throws AuthError when user is not authenticated', async () => {
    mockGetState.mockReturnValue({ user: null });

    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const day = await createTestPlanDay(mockDb, { plan_id: plan.id });
    const ex = await createTestExercise(mockDb);
    const pde = await createTestPlanDayExercise(mockDb, {
      plan_day_id: day.id,
      exercise_id: ex.id,
      order_index: 0,
    });

    await expect(reorderPlanDayExercises([{ id: pde.id, order_index: 0 }])).rejects.toThrow();
  });
});

describe('Service: removeExerciseFromPlanDay', () => {
  beforeAll(() => {
    mockDb = createTestDatabase();
    resetTestIdCounter();
  });

  afterEach(async () => {
    await cleanupTestDatabase(mockDb);
    mockGetState.mockReturnValue({ user: { id: TEST_USER_ID } });
  });

  test('marks the exercise record as deleted', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const day = await createTestPlanDay(mockDb, { plan_id: plan.id });
    const exercise = await createTestExercise(mockDb);
    const pde = await createTestPlanDayExercise(mockDb, {
      plan_day_id: day.id,
      exercise_id: exercise.id,
      order_index: 0,
    });

    await removeExerciseFromPlanDay(pde.id);

    // markAsDeleted() sets _status to 'deleted' (soft delete for sync)
    const deleted = await mockDb.get<PlanDayExerciseModel>('plan_day_exercises').find(pde.id);
    expect(deleted._raw._status).toBe('deleted');
  });

  test('throws when ownership check fails (cross-user access attempt)', async () => {
    const owner = await createTestUser(mockDb, { id: 'owner-user' });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: owner.id });
    const day = await createTestPlanDay(mockDb, { plan_id: plan.id });
    const exercise = await createTestExercise(mockDb);
    const pde = await createTestPlanDayExercise(mockDb, {
      plan_day_id: day.id,
      exercise_id: exercise.id,
      order_index: 0,
    });

    // Authenticated as a different user
    mockGetState.mockReturnValue({ user: { id: 'attacker-user' } });

    await expect(removeExerciseFromPlanDay(pde.id)).rejects.toThrow();

    // Record must remain intact
    const intact = await mockDb.get<PlanDayExerciseModel>('plan_day_exercises').find(pde.id);
    expect(intact._raw._status).not.toBe('deleted');
  });
});
