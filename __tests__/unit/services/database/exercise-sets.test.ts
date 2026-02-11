/**
 * Exercise Set CRUD Operations - Unit Tests
 *
 * Tests exercise set CRUD operations with focus on:
 * - Basic CRUD functionality
 * - Relationship with workout exercises
 * - Training metrics (RIR, RPE, failure)
 * - Sync protocol compliance
 *
 * @see {@link src/services/database/watermelon/models/ExerciseSet.ts}
 */

import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { createTestDatabase, cleanupTestDatabase } from '@test-helpers/database/test-database';
import ExerciseSet from '@/services/database/local/models/ExerciseSet';
import {
  createTestExerciseSet,
  createTestWorkoutExercise,
  createTestWorkout,
  createTestExercise,
  resetTestIdCounter,
  createMultipleRecords,
} from '@test-helpers/database/factories';

// NOTE: Sync protocol tests removed - require real SQLite, moved to E2E
// See: docs/TESTING.md

describe('Exercise Set CRUD Operations', () => {
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

  describe('createExerciseSet', () => {
    test('creates set with required fields', async () => {
      const workout = await createTestWorkout(database);
      const exercise = await createTestExercise(database);
      const workoutExercise = await createTestWorkoutExercise(database, {
        workout_id: workout.id,
        exercise_id: exercise.id,
      });

      const set = await createTestExerciseSet(database, {
        workout_exercise_id: workoutExercise.id,
        set_number: 1,
        weight: 225,
        reps: 5,
      });

      expect(set.workoutExerciseId).toBe(workoutExercise.id);
      expect(set.setNumber).toBe(1);
      expect(set.weight).toBe(225);
      expect(set.reps).toBe(5);
    });

    test('creates warmup set', async () => {
      const workout = await createTestWorkout(database);
      const exercise = await createTestExercise(database);
      const workoutExercise = await createTestWorkoutExercise(database, {
        workout_id: workout.id,
        exercise_id: exercise.id,
      });

      const set = await createTestExerciseSet(database, {
        workout_exercise_id: workoutExercise.id,
        weight: 135,
        reps: 10,
        is_warmup: true,
      });

      expect(set.isWarmup).toBe(true);
      expect(set.isFailure).toBe(false);
    });

    test('creates set with RIR and RPE', async () => {
      const workout = await createTestWorkout(database);
      const exercise = await createTestExercise(database);
      const workoutExercise = await createTestWorkoutExercise(database, {
        workout_id: workout.id,
        exercise_id: exercise.id,
      });

      const set = await createTestExerciseSet(database, {
        workout_exercise_id: workoutExercise.id,
        weight: 315,
        reps: 3,
        rir: 2, // 2 reps in reserve
        rpe: 8, // RPE 8/10
      });

      expect(set.rir).toBe(2);
      expect(set.rpe).toBe(8);
    });

    test('creates failure set', async () => {
      const workout = await createTestWorkout(database);
      const exercise = await createTestExercise(database);
      const workoutExercise = await createTestWorkoutExercise(database, {
        workout_id: workout.id,
        exercise_id: exercise.id,
      });

      const set = await createTestExerciseSet(database, {
        workout_exercise_id: workoutExercise.id,
        weight: 185,
        reps: 12,
        is_failure: true,
        rir: 0, // No reps in reserve (failure)
      });

      expect(set.isFailure).toBe(true);
      expect(set.rir).toBe(0);
    });

    // NOTE: Test "creates set with sync protocol columns" removed
    // Sync protocol testing requires real SQLite - moved to E2E
  });

  // ==========================================================================
  // READ Operations
  // ==========================================================================

  describe('readExerciseSet', () => {
    test('reads set by ID', async () => {
      const workout = await createTestWorkout(database);
      const exercise = await createTestExercise(database);
      const workoutExercise = await createTestWorkoutExercise(database, {
        workout_id: workout.id,
        exercise_id: exercise.id,
      });

      const set = await createTestExerciseSet(database, {
        workout_exercise_id: workoutExercise.id,
        weight: 225,
        reps: 5,
      });

      const found = (await database.get('exercise_sets').find(set.id)) as ExerciseSet;
      expect(found.weight).toBe(225);
      expect(found.reps).toBe(5);
    });

    test('reads all sets for workout exercise', async () => {
      const workout = await createTestWorkout(database);
      const exercise = await createTestExercise(database);
      const workoutExercise = await createTestWorkoutExercise(database, {
        workout_id: workout.id,
        exercise_id: exercise.id,
      });

      // Create 4 sets
      await createMultipleRecords(createTestExerciseSet, database, 4, (i) => ({
        workout_exercise_id: workoutExercise.id,
        set_number: i + 1,
        weight: 225,
        reps: 5,
      }));

      const sets = await database
        .get('exercise_sets')
        .query(Q.where('workout_exercise_id', workoutExercise.id))
        .fetch();

      expect(sets).toHaveLength(4);
    });

    test('reads sets ordered by set_number', async () => {
      const workout = await createTestWorkout(database);
      const exercise = await createTestExercise(database);
      const workoutExercise = await createTestWorkoutExercise(database, {
        workout_id: workout.id,
        exercise_id: exercise.id,
      });

      // Create sets out of order
      await createTestExerciseSet(database, {
        workout_exercise_id: workoutExercise.id,
        set_number: 3,
      });
      await createTestExerciseSet(database, {
        workout_exercise_id: workoutExercise.id,
        set_number: 1,
      });
      await createTestExerciseSet(database, {
        workout_exercise_id: workoutExercise.id,
        set_number: 2,
      });

      const sets = (await database
        .get('exercise_sets')
        .query(Q.where('workout_exercise_id', workoutExercise.id), Q.sortBy('set_number', Q.asc))
        .fetch()) as ExerciseSet[];

      expect(sets[0]?.setNumber).toBe(1);
      expect(sets[1]?.setNumber).toBe(2);
      expect(sets[2]?.setNumber).toBe(3);
    });

    test('filters warmup sets', async () => {
      const workout = await createTestWorkout(database);
      const exercise = await createTestExercise(database);
      const workoutExercise = await createTestWorkoutExercise(database, {
        workout_id: workout.id,
        exercise_id: exercise.id,
      });

      await createTestExerciseSet(database, {
        workout_exercise_id: workoutExercise.id,
        is_warmup: true,
      });
      await createTestExerciseSet(database, {
        workout_exercise_id: workoutExercise.id,
        is_warmup: true,
      });
      await createTestExerciseSet(database, {
        workout_exercise_id: workoutExercise.id,
        is_warmup: false,
      });

      const warmupSets = await database
        .get('exercise_sets')
        .query(Q.where('is_warmup', true))
        .fetch();

      expect(warmupSets).toHaveLength(2);
    });
  });

  // ==========================================================================
  // UPDATE Operations
  // ==========================================================================

  describe('updateExerciseSet', () => {
    test('updates set weight and reps', async () => {
      const workout = await createTestWorkout(database);
      const exercise = await createTestExercise(database);
      const workoutExercise = await createTestWorkoutExercise(database, {
        workout_id: workout.id,
        exercise_id: exercise.id,
      });

      const set = await createTestExerciseSet(database, {
        workout_exercise_id: workoutExercise.id,
        weight: 185,
        reps: 10,
      });

      await database.write(async () => {
        await set.update((s: any) => {
          s.weight = 205;
          s.reps = 8;
        });
      });

      const updated = (await database.get('exercise_sets').find(set.id)) as ExerciseSet;
      expect(updated.weight).toBe(205);
      expect(updated.reps).toBe(8);
    });

    test('updates RIR and RPE', async () => {
      const workout = await createTestWorkout(database);
      const exercise = await createTestExercise(database);
      const workoutExercise = await createTestWorkoutExercise(database, {
        workout_id: workout.id,
        exercise_id: exercise.id,
      });

      const set = await createTestExerciseSet(database, {
        workout_exercise_id: workoutExercise.id,
        weight: 225,
        reps: 5,
        rir: null,
        rpe: null,
      });

      await database.write(async () => {
        await set.update((s: any) => {
          s.rir = 3;
          s.rpe = 7;
        });
      });

      const updated = (await database.get('exercise_sets').find(set.id)) as ExerciseSet;
      expect(updated.rir).toBe(3);
      expect(updated.rpe).toBe(7);
    });

    // NOTE: Test "updates _changed timestamp on modification" removed
    // Sync protocol testing requires real SQLite - moved to E2E
  });

  // ==========================================================================
  // DELETE Operations
  // ==========================================================================

  // NOTE: Delete operations (soft delete, _status checks) removed
  // Sync protocol testing requires real SQLite - moved to E2E
  // See: docs/TESTING.md
});
