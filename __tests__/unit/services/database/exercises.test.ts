/**
 * Exercise CRUD Operations - Unit Tests
 *
 * Tests exercise CRUD operations with focus on:
 * - Basic CRUD functionality
 * - Sync protocol compliance
 * - Data validation
 *
 * @see {@link src/services/database/watermelon/models/Exercise.ts}
 */

import { Database } from '@nozbe/watermelondb';
import { createTestDatabase, cleanupTestDatabase } from '@test-helpers/database/test-database';
import Exercise from '@/services/database/local/models/Exercise';
import { createTestExercise, resetTestIdCounter } from '@test-helpers/database/factories';
import { getAllRecords } from '@test-helpers/database/queries';

// NOTE: Sync protocol tests removed - require real SQLite, moved to E2E
// See: docs/TESTING.md

describe('Exercise CRUD Operations', () => {
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

  describe('createExercise', () => {
    test('creates exercise with required fields', async () => {
      const exercise = await createTestExercise(database, {
        name: 'Bench Press',
        target_muscles: ['Pectoralis Major'],
      });

      expect(exercise.name).toBe('Bench Press');
      expect(exercise.targetMuscles).toEqual(['Pectoralis Major']);
    });

    test('creates exercise with optional equipment and instructions', async () => {
      const exercise = await createTestExercise(database, {
        name: 'Squat',
        target_muscles: ['Quadriceps'],
        equipments: ['Barbell'],
        instructions: ['Keep chest up', 'Drive through heels'],
      });

      expect(exercise.equipments).toEqual(['Barbell']);
      expect(exercise.instructions).toEqual(['Keep chest up', 'Drive through heels']);
    });

    // NOTE: Test "creates exercise with sync protocol columns" removed
    // Sync protocol testing requires real SQLite - moved to E2E
  });

  // ==========================================================================
  // READ Operations
  // ==========================================================================

  describe('readExercise', () => {
    test('reads exercise by ID', async () => {
      const exercise = await createTestExercise(database, { name: 'Deadlift' });

      const found = (await database.get('exercises').find(exercise.id)) as Exercise;
      expect(found.name).toBe('Deadlift');
    });

    test('reads exercises by body part', async () => {
      await createTestExercise(database, { name: 'Bench Press', body_parts: ['Chest'] });
      await createTestExercise(database, { name: 'Incline Press', body_parts: ['Chest'] });
      await createTestExercise(database, { name: 'Squat', body_parts: ['Legs'] });

      const exercises = (await getAllRecords(database, 'exercises')) as Exercise[];
      const chestExercises = exercises.filter((ex) => ex.bodyParts.includes('Chest'));

      expect(chestExercises).toHaveLength(2);
    });
  });

  // ==========================================================================
  // UPDATE Operations
  // ==========================================================================

  describe('updateExercise', () => {
    test('updates exercise name', async () => {
      const exercise = await createTestExercise(database, { name: 'Old Name' });

      await database.write(async () => {
        await exercise.update((e: any) => {
          e.name = 'New Name';
        });
      });

      const updated = (await database.get('exercises').find(exercise.id)) as Exercise;
      expect(updated.name).toBe('New Name');
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
