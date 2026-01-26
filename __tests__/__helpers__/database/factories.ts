/**
 * Test Data Factories
 *
 * Provides reusable factory functions for generating test data.
 * Follows DRY principle with sensible defaults and override support.
 *
 * @module factories
 */

import { Database } from '@nozbe/watermelondb';
import User from '@/services/database/local/models/User';
import Workout from '@/services/database/local/models/Workout';
import Exercise from '@/services/database/local/models/Exercise';
import WorkoutExercise from '@/services/database/local/models/WorkoutExercise';
import ExerciseSet from '@/services/database/local/models/ExerciseSet';
import WorkoutPlan from '@/services/database/local/models/WorkoutPlan';
import PlanDay from '@/services/database/local/models/PlanDay';
import PlanDayExercise from '@/services/database/local/models/PlanDayExercise';

/**
 * Counter for generating unique IDs in tests.
 * Ensures no ID collisions across test runs.
 */
let idCounter = 0;

/**
 * Generates a unique test ID with prefix.
 *
 * @param {string} prefix - Prefix for the ID (e.g., 'user', 'workout')
 * @returns {string} Unique ID (e.g., 'test-user-1', 'test-workout-2')
 */
export function generateTestId(prefix: string): string {
  idCounter += 1;
  return `test-${prefix}-${idCounter}`;
}

/**
 * Resets the ID counter.
 * Call this in beforeEach() to ensure consistent IDs per test.
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   resetTestIdCounter();
 * });
 * ```
 */
export function resetTestIdCounter(): void {
  idCounter = 0;
}

// ============================================================================
// User Factories
// ============================================================================

export interface TestUserData {
  id?: string;
  email?: string;
  name?: string;
  avatar_url?: string | null;
}

/**
 * Creates test user data with sensible defaults.
 *
 * @param {Partial<TestUserData>} overrides - Optional field overrides
 * @returns {TestUserData} User data ready for database insertion
 *
 * @example
 * ```typescript
 * const user = createTestUserData();
 * // { id: 'test-user-1', email: 'test-user-1@example.com', ... }
 *
 * const customUser = createTestUserData({ email: 'custom@example.com' });
 * // { id: 'test-user-2', email: 'custom@example.com', ... }
 * ```
 */
export function createTestUserData(overrides: Partial<TestUserData> = {}): TestUserData {
  const id = overrides.id || generateTestId('user');

  return {
    id,
    email: overrides.email || `${id}@example.com`,
    name: overrides.name || `Test User ${idCounter}`,
    avatar_url: overrides.avatar_url !== undefined ? overrides.avatar_url : null,
    ...overrides,
  };
}

/**
 * Creates and persists a test user in the database.
 *
 * @param {Database} database - WatermelonDB instance
 * @param {Partial<TestUserData>} overrides - Optional field overrides
 * @returns {Promise<User>} Created user model
 *
 * @example
 * ```typescript
 * const user = await createTestUser(database);
 * expect(user.email).toBe('test-user-1@example.com');
 * ```
 */
export async function createTestUser(
  database: Database,
  overrides: Partial<TestUserData> = {}
): Promise<User> {
  const userData = createTestUserData(overrides);
  const usersCollection = database.get('users');

  return (await database.write(async () => {
    return await usersCollection.create((user: any) => {
      user._raw.id = userData.id;
      user.email = userData.email!;
      user.name = userData.name!;
      user.avatarUrl = userData.avatar_url;
    });
  })) as User;
}

// ============================================================================
// Workout Factories
// ============================================================================

export interface TestWorkoutData {
  id?: string;
  user_id?: string;
  title?: string;
  notes?: string | null;
  started_at?: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  nutrition_phase?: string;
}

/**
 * Creates test workout data with sensible defaults.
 *
 * @param {Partial<TestWorkoutData>} overrides - Optional field overrides
 * @returns {TestWorkoutData} Workout data ready for creation
 *
 * @example
 * ```typescript
 * const workoutData = createTestWorkoutData({ title: 'Leg Day' });
 * // { user_id: 'test-user-1', title: 'Leg Day', ... }
 * ```
 */
export function createTestWorkoutData(overrides: Partial<TestWorkoutData> = {}): TestWorkoutData {
  return {
    user_id: overrides.user_id || generateTestId('user'),
    title: overrides.title || `Test Workout ${idCounter}`,
    notes: overrides.notes || null,
    started_at: overrides.started_at || new Date().toISOString(),
    completed_at: overrides.completed_at || null,
    duration_seconds: overrides.duration_seconds || null,
    nutrition_phase: overrides.nutrition_phase || 'maintenance',
    ...overrides,
  };
}

/**
 * Creates and persists a test workout in the database.
 *
 * Note: This uses the workouts service layer for consistency with production code.
 *
 * @param {Database} database - WatermelonDB instance
 * @param {Partial<TestWorkoutData>} overrides - Optional field overrides
 * @returns {Promise<Workout>} Created workout model
 *
 * @example
 * ```typescript
 * const workout = await createTestWorkout(database, {
 *   title: 'Push Day',
 *   status: 'completed'
 * });
 * expect(workout.title).toBe('Push Day');
 * ```
 */
export async function createTestWorkout(
  database: Database,
  overrides: Partial<TestWorkoutData> = {}
): Promise<Workout> {
  const workoutData = createTestWorkoutData(overrides);
  const workoutsCollection = database.get('workouts');

  return (await database.write(async () => {
    return await workoutsCollection.create((workout: any) => {
      if (overrides.id) {
        workout._raw.id = overrides.id;
      }
      workout.userId = workoutData.user_id;
      workout.title = workoutData.title;
      workout.notes = workoutData.notes;
      workout.startedAt = workoutData.started_at ? new Date(workoutData.started_at) : new Date();
      workout.completedAt = workoutData.completed_at ? new Date(workoutData.completed_at) : null;
      workout.durationSeconds = workoutData.duration_seconds;
    });
  })) as Workout;
}

// ============================================================================
// Exercise Factories
// ============================================================================

export interface TestExerciseData {
  id?: string;
  exercisedb_id?: string;
  name?: string;
  body_parts?: string[];
  target_muscles?: string[];
  secondary_muscles?: string[];
  equipments?: string[];
  exercise_type?: string;
  instructions?: string[];
  exercise_tips?: string[];
  variations?: string[];
  overview?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  keywords?: string[];
  movement_pattern?: 'compound' | 'isolation';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Creates test exercise data with sensible defaults (ExerciseDB-aligned schema).
 *
 * @param {Partial<TestExerciseData>} overrides - Optional field overrides
 * @returns {TestExerciseData} Exercise data ready for creation
 *
 * @example
 * ```typescript
 * const exerciseData = createTestExerciseData({ name: 'Bench Press' });
 * ```
 */
export function createTestExerciseData(
  overrides: Partial<TestExerciseData> = {}
): TestExerciseData {
  const id = overrides.id || generateTestId('exercise');
  return {
    id,
    exercisedb_id: overrides.exercisedb_id || `test-ex-${id}`,
    name: overrides.name || `Test Exercise ${idCounter}`,
    body_parts: overrides.body_parts || ['Chest'],
    target_muscles: overrides.target_muscles || ['Pectoralis Major'],
    secondary_muscles: overrides.secondary_muscles || ['Triceps'],
    equipments: overrides.equipments || ['Barbell'],
    exercise_type: overrides.exercise_type || 'weight_reps',
    instructions: overrides.instructions || [
      'Step 1: Setup position',
      'Step 2: Execute movement',
      'Step 3: Return to start',
    ],
    exercise_tips: overrides.exercise_tips || ['Maintain proper form', 'Control the weight'],
    variations: overrides.variations || ['Incline variation', 'Decline variation'],
    overview:
      overrides.overview !== undefined
        ? overrides.overview
        : 'A compound exercise for upper body strength',
    image_url: overrides.image_url !== undefined ? overrides.image_url : null,
    video_url: overrides.video_url !== undefined ? overrides.video_url : null,
    keywords: overrides.keywords || ['chest', 'press', 'compound'],
    difficulty: overrides.difficulty || 'intermediate',
    ...overrides,
  };
}

/**
 * Creates and persists a test exercise in the database (ExerciseDB-aligned schema).
 *
 * @param {Database} database - WatermelonDB instance
 * @param {Partial<TestExerciseData>} overrides - Optional field overrides
 * @returns {Promise<Exercise>} Created exercise model
 *
 * @example
 * ```typescript
 * const exercise = await createTestExercise(database, {
 *   name: 'Squat',
 *   body_parts: ['Legs'],
 *   target_muscles: ['Quadriceps']
 * });
 * ```
 */
export async function createTestExercise(
  database: Database,
  overrides: Partial<TestExerciseData> = {}
): Promise<Exercise> {
  const exerciseData = createTestExerciseData(overrides);
  const exercisesCollection = database.get('exercises');

  return (await database.write(async () => {
    return await exercisesCollection.create((exercise: any) => {
      exercise._raw.id = exerciseData.id;
      exercise.exercisedbId = exerciseData.exercisedb_id!;
      exercise.name = exerciseData.name!;

      // ExerciseDB fields (arrays handled by @json decorator)
      exercise.bodyParts = exerciseData.body_parts!;
      exercise.targetMuscles = exerciseData.target_muscles!;
      exercise.secondaryMuscles = exerciseData.secondary_muscles!;
      exercise.equipments = exerciseData.equipments!;
      exercise.exerciseType = exerciseData.exercise_type!;
      exercise.instructions = exerciseData.instructions!;
      exercise.exerciseTips = exerciseData.exercise_tips!;
      exercise.variations = exerciseData.variations!;
      exercise.overview = exerciseData.overview || '';
      exercise.imageUrl = exerciseData.image_url || '';
      exercise.videoUrl = exerciseData.video_url || '';
      exercise.keywords = exerciseData.keywords!;

      // Halterofit-specific fields
      exercise.movementPattern = exerciseData.movement_pattern!;
      exercise.difficulty = exerciseData.difficulty!;
    });
  })) as Exercise;
}

// ============================================================================
// WorkoutExercise Factories
// ============================================================================

export interface TestWorkoutExerciseData {
  id?: string;
  workout_id?: string;
  exercise_id?: string;
  order_index?: number;
  notes?: string | null;
  rest_seconds?: number;
}

/**
 * Creates test workout exercise data with sensible defaults.
 *
 * @param {Partial<TestWorkoutExerciseData>} overrides - Optional field overrides
 * @returns {TestWorkoutExerciseData} Workout exercise data ready for creation
 *
 * @example
 * ```typescript
 * const weData = createTestWorkoutExerciseData({
 *   workout_id: 'workout-1',
 *   exercise_id: 'exercise-1'
 * });
 * ```
 */
export function createTestWorkoutExerciseData(
  overrides: Partial<TestWorkoutExerciseData> = {}
): TestWorkoutExerciseData {
  return {
    workout_id: overrides.workout_id || generateTestId('workout'),
    exercise_id: overrides.exercise_id || generateTestId('exercise'),
    order_index: overrides.order_index !== undefined ? overrides.order_index : 0,
    notes: overrides.notes || null,
    rest_seconds: overrides.rest_seconds !== undefined ? overrides.rest_seconds : 90,
    ...overrides,
  };
}

/**
 * Creates and persists a test workout exercise in the database.
 *
 * @param {Database} database - WatermelonDB instance
 * @param {Partial<TestWorkoutExerciseData>} overrides - Optional field overrides
 * @returns {Promise<WorkoutExercise>} Created workout exercise model
 *
 * @example
 * ```typescript
 * const we = await createTestWorkoutExercise(database, {
 *   workout_id: workout.id,
 *   exercise_id: exercise.id,
 *   order_index: 0
 * });
 * ```
 */
export async function createTestWorkoutExercise(
  database: Database,
  overrides: Partial<TestWorkoutExerciseData> = {}
): Promise<WorkoutExercise> {
  const weData = createTestWorkoutExerciseData(overrides);
  const workoutExercisesCollection = database.get('workout_exercises');

  return (await database.write(async () => {
    return await workoutExercisesCollection.create((we: any) => {
      if (overrides.id) {
        we._raw.id = overrides.id;
      }
      we.workoutId = weData.workout_id;
      we.exerciseId = weData.exercise_id;
      we.orderIndex = weData.order_index;
      we.notes = weData.notes;
      we.restSeconds = weData.rest_seconds;
    });
  })) as WorkoutExercise;
}

// ============================================================================
// ExerciseSet Factories
// ============================================================================

export interface TestExerciseSetData {
  id?: string;
  workout_exercise_id?: string;
  set_number?: number;
  weight?: number;
  reps?: number;
  is_warmup?: boolean;
  is_failure?: boolean;
  rir?: number | null;
  rpe?: number | null;
  notes?: string | null;
}

/**
 * Creates test exercise set data with sensible defaults.
 *
 * @param {Partial<TestExerciseSetData>} overrides - Optional field overrides
 * @returns {TestExerciseSetData} Exercise set data ready for creation
 *
 * @example
 * ```typescript
 * const setData = createTestExerciseSetData({
 *   weight: 100,
 *   reps: 10
 * });
 * ```
 */
export function createTestExerciseSetData(
  overrides: Partial<TestExerciseSetData> = {}
): TestExerciseSetData {
  return {
    workout_exercise_id: overrides.workout_exercise_id || generateTestId('workout-exercise'),
    set_number: overrides.set_number !== undefined ? overrides.set_number : 1,
    weight: overrides.weight !== undefined ? overrides.weight : 100,
    reps: overrides.reps !== undefined ? overrides.reps : 10,
    is_warmup: overrides.is_warmup !== undefined ? overrides.is_warmup : false,
    is_failure: overrides.is_failure !== undefined ? overrides.is_failure : false,
    rir: overrides.rir !== undefined ? overrides.rir : null,
    rpe: overrides.rpe !== undefined ? overrides.rpe : null,
    notes: overrides.notes || null,
    ...overrides,
  };
}

/**
 * Creates and persists a test exercise set in the database.
 *
 * @param {Database} database - WatermelonDB instance
 * @param {Partial<TestExerciseSetData>} overrides - Optional field overrides
 * @returns {Promise<ExerciseSet>} Created exercise set model
 *
 * @example
 * ```typescript
 * const set = await createTestExerciseSet(database, {
 *   workout_exercise_id: we.id,
 *   weight: 225,
 *   reps: 5,
 *   rir: 2
 * });
 * ```
 */
export async function createTestExerciseSet(
  database: Database,
  overrides: Partial<TestExerciseSetData> = {}
): Promise<ExerciseSet> {
  const setData = createTestExerciseSetData(overrides);
  const setsCollection = database.get('exercise_sets');

  return (await database.write(async () => {
    return await setsCollection.create((set: any) => {
      if (overrides.id) {
        set._raw.id = overrides.id;
      }
      set.workoutExerciseId = setData.workout_exercise_id;
      set.setNumber = setData.set_number;
      set.weight = setData.weight;
      set.reps = setData.reps;
      set.isWarmup = setData.is_warmup;
      set.isFailure = setData.is_failure;
      set.rir = setData.rir;
      set.rpe = setData.rpe;
      set.notes = setData.notes;
    });
  })) as ExerciseSet;
}

// ============================================================================
// WorkoutPlan Factories
// ============================================================================

export interface TestWorkoutPlanData {
  id?: string;
  user_id?: string;
  name?: string;
  is_active?: boolean;
  cover_image_url?: string | null;
}

/**
 * Creates test workout plan data with sensible defaults.
 */
export function createTestWorkoutPlanData(
  overrides: Partial<TestWorkoutPlanData> = {}
): TestWorkoutPlanData {
  return {
    user_id: overrides.user_id || generateTestId('user'),
    name: overrides.name || `Test Plan ${idCounter}`,
    is_active: overrides.is_active !== undefined ? overrides.is_active : false,
    cover_image_url: overrides.cover_image_url !== undefined ? overrides.cover_image_url : null,
    ...overrides,
  };
}

/**
 * Creates and persists a test workout plan in the database.
 */
export async function createTestWorkoutPlan(
  database: Database,
  overrides: Partial<TestWorkoutPlanData> = {}
): Promise<WorkoutPlan> {
  const planData = createTestWorkoutPlanData(overrides);
  const plansCollection = database.get('workout_plans');

  return (await database.write(async () => {
    return await plansCollection.create((plan: any) => {
      if (overrides.id) {
        plan._raw.id = overrides.id;
      }
      plan.userId = planData.user_id;
      plan.name = planData.name;
      plan.isActive = planData.is_active;
      plan.coverImageUrl = planData.cover_image_url;
    });
  })) as WorkoutPlan;
}

// ============================================================================
// PlanDay Factories
// ============================================================================

export interface TestPlanDayData {
  id?: string;
  plan_id?: string;
  name?: string;
  day_of_week?: string | null;
  order_index?: number;
}

/**
 * Creates test plan day data with sensible defaults.
 */
export function createTestPlanDayData(overrides: Partial<TestPlanDayData> = {}): TestPlanDayData {
  return {
    plan_id: overrides.plan_id || generateTestId('plan'),
    name: overrides.name || `Day ${idCounter}`,
    day_of_week: overrides.day_of_week !== undefined ? overrides.day_of_week : null,
    order_index: overrides.order_index !== undefined ? overrides.order_index : 0,
    ...overrides,
  };
}

/**
 * Creates and persists a test plan day in the database.
 */
export async function createTestPlanDay(
  database: Database,
  overrides: Partial<TestPlanDayData> = {}
): Promise<PlanDay> {
  const dayData = createTestPlanDayData(overrides);
  const daysCollection = database.get('plan_days');

  return (await database.write(async () => {
    return await daysCollection.create((day: any) => {
      if (overrides.id) {
        day._raw.id = overrides.id;
      }
      day.planId = dayData.plan_id;
      day.name = dayData.name;
      day.dayOfWeek = dayData.day_of_week;
      day.orderIndex = dayData.order_index;
    });
  })) as PlanDay;
}

// ============================================================================
// PlanDayExercise Factories
// ============================================================================

export interface TestPlanDayExerciseData {
  id?: string;
  plan_day_id?: string;
  exercise_id?: string;
  order_index?: number;
  target_sets?: number;
  target_reps?: number;
  rest_timer_seconds?: number | null;
  notes?: string | null;
}

/**
 * Creates test plan day exercise data with sensible defaults.
 */
export function createTestPlanDayExerciseData(
  overrides: Partial<TestPlanDayExerciseData> = {}
): TestPlanDayExerciseData {
  return {
    plan_day_id: overrides.plan_day_id || generateTestId('plan-day'),
    exercise_id: overrides.exercise_id || generateTestId('exercise'),
    order_index: overrides.order_index !== undefined ? overrides.order_index : 0,
    target_sets: overrides.target_sets !== undefined ? overrides.target_sets : 3,
    target_reps: overrides.target_reps !== undefined ? overrides.target_reps : 10,
    rest_timer_seconds:
      overrides.rest_timer_seconds !== undefined ? overrides.rest_timer_seconds : null,
    notes: overrides.notes !== undefined ? overrides.notes : null,
    ...overrides,
  };
}

/**
 * Creates and persists a test plan day exercise in the database.
 */
export async function createTestPlanDayExercise(
  database: Database,
  overrides: Partial<TestPlanDayExerciseData> = {}
): Promise<PlanDayExercise> {
  const pdeData = createTestPlanDayExerciseData(overrides);
  const pdeCollection = database.get('plan_day_exercises');

  return (await database.write(async () => {
    return await pdeCollection.create((pde: any) => {
      if (overrides.id) {
        pde._raw.id = overrides.id;
      }
      pde.planDayId = pdeData.plan_day_id;
      pde.exerciseId = pdeData.exercise_id;
      pde.orderIndex = pdeData.order_index;
      pde.targetSets = pdeData.target_sets;
      pde.targetReps = pdeData.target_reps;
      pde.restTimerSeconds = pdeData.rest_timer_seconds;
      pde.notes = pdeData.notes;
    });
  })) as PlanDayExercise;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates multiple records using a factory function.
 * Useful for bulk data generation in tests.
 *
 * @param {Function} factoryFn - Factory function to create each record
 * @param {Database} database - WatermelonDB instance
 * @param {number} count - Number of records to create
 * @param {Function} overridesFn - Optional function to generate overrides for each record (receives index)
 * @returns {Promise<Array>} Array of created records
 *
 * @example
 * ```typescript
 * const workouts = await createMultipleRecords(
 *   createTestWorkout,
 *   database,
 *   10,
 *   (i) => ({ title: `Workout ${i + 1}` })
 * );
 * ```
 */
export async function createMultipleRecords<T>(
  factoryFn: (database: Database, overrides?: any) => Promise<T>,
  database: Database,
  count: number,
  overridesFn?: (index: number) => any
): Promise<T[]> {
  const records: T[] = [];
  for (let i = 0; i < count; i++) {
    const overrides = overridesFn ? overridesFn(i) : {};
    const record = await factoryFn(database, overrides);
    records.push(record);
  }
  return records;
}
