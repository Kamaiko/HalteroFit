/**
 * Day Operations - Unit Tests
 *
 * Tests plan day service-layer functions with focus on:
 * - Pure validators: checkExerciseAdditions, validateExerciseAdditions,
 *   validateReorderInput, countExercisesByDay
 * - Service functions: createPlanDay, deletePlanDay, reorderPlanDays, savePlanDayEdits
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
import { countRecords } from '@test-helpers/database/queries';
import { MAX_EXERCISES_PER_DAY, MAX_DAYS_PER_PLAN } from '@/constants';
import { ValidationError, AuthError } from '@/utils/errors';
import type PlanDayModel from '@/services/database/local/models/PlanDay';
import type PlanDayExerciseModel from '@/services/database/local/models/PlanDayExercise';

// ============================================================================
// Pure function imports (no mocking needed)
// ============================================================================

import { countExercisesByDay } from '@/services/database/operations/plans/mappers';

import {
  checkExerciseAdditions,
  validateExerciseAdditions,
  validateReorderInput,
} from '@/services/database/operations/plans/exercise-operations';

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
  createPlanDay,
  deletePlanDay,
  reorderPlanDays,
  savePlanDayEdits,
  updatePlanDay,
} from '@/services/database/operations/plans/day-operations';

// ============================================================================
// Pure Function Tests
// ============================================================================

describe('countExercisesByDay', () => {
  // Create minimal mock objects with only the fields needed
  const mockPde = (planDayId: string) => ({ planDayId });

  test('returns zeroed record for all dayIds when exercises array is empty', () => {
    const result = countExercisesByDay([], ['day-1', 'day-2']);
    expect(result).toEqual({ 'day-1': 0, 'day-2': 0 });
  });

  test('counts correctly across multiple days', () => {
    const exercises = [mockPde('day-1'), mockPde('day-2'), mockPde('day-2'), mockPde('day-1')];
    const result = countExercisesByDay(exercises, ['day-1', 'day-2', 'day-3']);
    expect(result).toEqual({ 'day-1': 2, 'day-2': 2, 'day-3': 0 });
  });
});

describe('checkExerciseAdditions', () => {
  test('returns null when all checks pass', () => {
    const result = checkExerciseAdditions({
      currentCount: 5,
      existingExerciseIds: new Set(['ex-1', 'ex-2']),
      newExerciseIds: ['ex-3'],
    });
    expect(result).toBeNull();
  });

  test('returns limit error when adding would exceed MAX_EXERCISES_PER_DAY', () => {
    const result = checkExerciseAdditions({
      currentCount: MAX_EXERCISES_PER_DAY - 1,
      existingExerciseIds: new Set(),
      newExerciseIds: ['ex-1', 'ex-2'],
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe('limit');
    if (result!.type === 'limit') {
      expect(result!.available).toBe(1);
    }
  });

  test('returns duplicates error when newExerciseIds contains an existing ID', () => {
    const result = checkExerciseAdditions({
      currentCount: 1,
      existingExerciseIds: new Set(['ex-1']),
      newExerciseIds: ['ex-1', 'ex-2'],
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe('duplicates');
    if (result!.type === 'duplicates') {
      expect(result!.duplicateIds).toEqual(['ex-1']);
    }
  });

  test('returns duplicates error for within-batch duplicates', () => {
    const result = checkExerciseAdditions({
      currentCount: 0,
      existingExerciseIds: new Set(),
      newExerciseIds: ['ex-1', 'ex-1'],
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe('duplicates');
    if (result!.type === 'duplicates') {
      expect(result!.duplicateIds).toEqual(['ex-1']);
    }
  });
});

describe('validateExerciseAdditions', () => {
  test('includes dayId in the developer message', () => {
    try {
      validateExerciseAdditions({
        currentCount: 1,
        existingExerciseIds: new Set(['ex-1']),
        newExerciseIds: ['ex-1'],
        dayId: 'my-day-42',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).developerMessage).toContain('my-day-42');
    }
  });
});

describe('validateReorderInput', () => {
  test('does not throw for a valid contiguous 0-based batch', () => {
    expect(() =>
      validateReorderInput(
        [
          { id: 'a', order_index: 0 },
          { id: 'b', order_index: 1 },
          { id: 'c', order_index: 2 },
        ],
        'test'
      )
    ).not.toThrow();
  });

  test('throws ValidationError when duplicate IDs are present', () => {
    expect(() =>
      validateReorderInput(
        [
          { id: 'a', order_index: 0 },
          { id: 'a', order_index: 1 },
        ],
        'test'
      )
    ).toThrow(ValidationError);
  });

  test('throws ValidationError when indices have a gap', () => {
    expect(() =>
      validateReorderInput(
        [
          { id: 'a', order_index: 0 },
          { id: 'b', order_index: 2 },
        ],
        'test'
      )
    ).toThrow(ValidationError);
  });
});

// ============================================================================
// Service Function Tests (require DB + auth mocking)
// ============================================================================

const TEST_USER_ID = 'test-user-auth';

describe('Service: createPlanDay', () => {
  beforeAll(() => {
    mockDb = createTestDatabase();
    resetTestIdCounter();
  });

  afterEach(async () => {
    await cleanupTestDatabase(mockDb);
    mockGetState.mockReturnValue({ user: { id: TEST_USER_ID } });
  });

  test('creates a day with correct fields', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });

    const day = await createPlanDay({
      plan_id: plan.id,
      name: 'Chest Day',
      order_index: 0,
    });

    expect(day.name).toBe('Chest Day');
    expect(day.plan_id).toBe(plan.id);
    expect(day.order_index).toBe(0);
    expect(day.id).toBeDefined();
  });

  test('throws ValidationError when MAX_DAYS_PER_PLAN is exceeded', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });

    // Create MAX_DAYS_PER_PLAN days
    for (let i = 0; i < MAX_DAYS_PER_PLAN; i++) {
      await createTestPlanDay(mockDb, {
        plan_id: plan.id,
        name: `Day ${i + 1}`,
        order_index: i,
      });
    }

    await expect(
      createPlanDay({ plan_id: plan.id, name: 'One Too Many', order_index: MAX_DAYS_PER_PLAN })
    ).rejects.toThrow(ValidationError);
  });

  test('throws AuthError when user is not authenticated', async () => {
    mockGetState.mockReturnValueOnce({ user: null });

    await expect(createPlanDay({ plan_id: 'any', name: 'Day 1', order_index: 0 })).rejects.toThrow(
      AuthError
    );
  });
});

describe('Service: deletePlanDay', () => {
  beforeAll(() => {
    mockDb = createTestDatabase();
    resetTestIdCounter();
  });

  afterEach(async () => {
    await cleanupTestDatabase(mockDb);
    mockGetState.mockReturnValue({ user: { id: TEST_USER_ID } });
  });

  test('deletes day and cascades to exercises', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const day = await createTestPlanDay(mockDb, { plan_id: plan.id });
    const exercise = await createTestExercise(mockDb);
    await createTestPlanDayExercise(mockDb, {
      plan_day_id: day.id,
      exercise_id: exercise.id,
    });

    expect(await countRecords(mockDb, 'plan_day_exercises')).toBe(1);
    expect(await countRecords(mockDb, 'plan_days')).toBe(1);

    await deletePlanDay(day.id);

    expect(await countRecords(mockDb, 'plan_days')).toBe(0);
    expect(await countRecords(mockDb, 'plan_day_exercises')).toBe(0);
  });

  test('succeeds when day has zero exercises', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const day = await createTestPlanDay(mockDb, { plan_id: plan.id });

    await deletePlanDay(day.id);

    expect(await countRecords(mockDb, 'plan_days')).toBe(0);
  });
});

describe('Service: updatePlanDay', () => {
  beforeAll(() => {
    mockDb = createTestDatabase();
    resetTestIdCounter();
  });

  afterEach(async () => {
    await cleanupTestDatabase(mockDb);
    mockGetState.mockReturnValue({ user: { id: TEST_USER_ID } });
  });

  test('trims whitespace from name before saving', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const day = await createTestPlanDay(mockDb, { plan_id: plan.id, name: 'Original' });

    const updated = await updatePlanDay(day.id, { name: '  Legs  ' });

    expect(updated.name).toBe('Legs');
  });
});

describe('Service: reorderPlanDays', () => {
  beforeAll(() => {
    mockDb = createTestDatabase();
    resetTestIdCounter();
  });

  afterEach(async () => {
    await cleanupTestDatabase(mockDb);
    mockGetState.mockReturnValue({ user: { id: TEST_USER_ID } });
  });

  test('does nothing for empty array', async () => {
    await expect(reorderPlanDays([])).resolves.toBeUndefined();
  });

  test('updates order_index for each day', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const dayA = await createTestPlanDay(mockDb, {
      plan_id: plan.id,
      name: 'A',
      order_index: 0,
    });
    const dayB = await createTestPlanDay(mockDb, {
      plan_id: plan.id,
      name: 'B',
      order_index: 1,
    });
    const dayC = await createTestPlanDay(mockDb, {
      plan_id: plan.id,
      name: 'C',
      order_index: 2,
    });

    // Reverse order: C, B, A
    await reorderPlanDays([
      { id: dayC.id, order_index: 0 },
      { id: dayB.id, order_index: 1 },
      { id: dayA.id, order_index: 2 },
    ]);

    const days = await mockDb
      .get<PlanDayModel>('plan_days')
      .query(Q.where('plan_id', plan.id), Q.sortBy('order_index', Q.asc))
      .fetch();

    expect(days.map((d) => d.name)).toEqual(['C', 'B', 'A']);
  });

  test('throws ValidationError when batch is incomplete (missing days)', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const dayA = await createTestPlanDay(mockDb, {
      plan_id: plan.id,
      name: 'A',
      order_index: 0,
    });
    await createTestPlanDay(mockDb, { plan_id: plan.id, name: 'B', order_index: 1 });

    // Only pass 1 of 2 days
    await expect(reorderPlanDays([{ id: dayA.id, order_index: 0 }])).rejects.toThrow(
      ValidationError
    );
  });
});

describe('Service: savePlanDayEdits', () => {
  beforeAll(() => {
    mockDb = createTestDatabase();
    resetTestIdCounter();
  });

  afterEach(async () => {
    await cleanupTestDatabase(mockDb);
    mockGetState.mockReturnValue({ user: { id: TEST_USER_ID } });
  });

  test('updates name (with trimming)', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const day = await createTestPlanDay(mockDb, { plan_id: plan.id, name: 'Old Name' });

    await savePlanDayEdits({
      dayId: day.id,
      name: '  New Name  ',
      removedExerciseIds: [],
      addedExercises: [],
      reorderedExercises: [],
    });

    const updated = await mockDb.get<PlanDayModel>('plan_days').find(day.id);
    expect(updated.name).toBe('New Name');
  });

  test('removes specified exercises', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const day = await createTestPlanDay(mockDb, { plan_id: plan.id });
    const exercise = await createTestExercise(mockDb);
    const pde = await createTestPlanDayExercise(mockDb, {
      plan_day_id: day.id,
      exercise_id: exercise.id,
    });

    await savePlanDayEdits({
      dayId: day.id,
      removedExerciseIds: [pde.id],
      addedExercises: [],
      reorderedExercises: [],
    });

    expect(await countRecords(mockDb, 'plan_day_exercises')).toBe(0);
  });

  test('adds new exercises with correct order and defaults', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const day = await createTestPlanDay(mockDb, { plan_id: plan.id });
    const exercise = await createTestExercise(mockDb);

    await savePlanDayEdits({
      dayId: day.id,
      removedExerciseIds: [],
      addedExercises: [{ exercise_id: exercise.id, order_index: 0 }],
      reorderedExercises: [],
    });

    const pdes = await mockDb
      .get<PlanDayExerciseModel>('plan_day_exercises')
      .query(Q.where('plan_day_id', day.id))
      .fetch();

    expect(pdes).toHaveLength(1);
    expect(pdes[0]!.exerciseId).toBe(exercise.id);
    expect(pdes[0]!.orderIndex).toBe(0);
  });

  test('respects deletions when checking exercise limit', async () => {
    const user = await createTestUser(mockDb, { id: TEST_USER_ID });
    const plan = await createTestWorkoutPlan(mockDb, { user_id: user.id });
    const day = await createTestPlanDay(mockDb, { plan_id: plan.id });

    // Fill day to MAX-1, then remove 1, then add 2 → net +1 from (MAX-1) = MAX → should pass
    const exercises = [];
    const pdeIds = [];
    for (let i = 0; i < MAX_EXERCISES_PER_DAY - 1; i++) {
      const ex = await createTestExercise(mockDb);
      exercises.push(ex);
      const pde = await createTestPlanDayExercise(mockDb, {
        plan_day_id: day.id,
        exercise_id: ex.id,
        order_index: i,
      });
      pdeIds.push(pde.id);
    }

    const newEx1 = await createTestExercise(mockDb);
    const newEx2 = await createTestExercise(mockDb);

    // Remove first exercise, add 2 new → final count = (MAX-1) - 1 + 2 = MAX → valid
    await expect(
      savePlanDayEdits({
        dayId: day.id,
        removedExerciseIds: [pdeIds[0]!],
        addedExercises: [
          { exercise_id: newEx1.id, order_index: MAX_EXERCISES_PER_DAY - 2 },
          { exercise_id: newEx2.id, order_index: MAX_EXERCISES_PER_DAY - 1 },
        ],
        reorderedExercises: [],
      })
    ).resolves.toBeUndefined();
  });
});
