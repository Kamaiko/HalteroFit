/**
 * Exercise Seeding Service
 *
 * Loads bundled exercise data into WatermelonDB on first app launch.
 * Exercises are static data from ExerciseDB dataset (1,500+ exercises).
 *
 * @see docs/DATABASE.md § ExerciseDB Dataset
 */

import { database } from '../local';
import ExerciseModel from '../local/models/Exercise';
import { mmkvStorage } from '@/services/storage';

// Storage key for tracking seed version
const EXERCISE_SEED_VERSION_KEY = 'exercise_seed_version';

const SEED_VERSION = 2; // Increment to force re-seed on app update (v2: Dec 2025 dataset)

interface ExerciseData {
  exerciseId: string;
  name: string;
  gifUrl?: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

/**
 * Check if exercises need to be seeded
 */
export async function needsExerciseSeeding(): Promise<boolean> {
  try {
    // Check seed version
    const seededVersion = mmkvStorage.getNumber(EXERCISE_SEED_VERSION_KEY);
    if (seededVersion !== SEED_VERSION) {
      return true;
    }

    // Double-check: verify exercises exist in DB
    const count = await database.get<ExerciseModel>('exercises').query().fetchCount();
    return count === 0;
  } catch (error) {
    console.error('Error checking exercise seed status:', error);
    return true;
  }
}

/**
 * Seed exercises into WatermelonDB
 * Clears existing exercises and re-imports from bundled dataset
 */
export async function seedExercises(): Promise<{ success: boolean; count: number }> {
  if (__DEV__) console.log('Starting exercise seeding...');

  try {
    // Clear existing exercises first (for re-seeding scenarios)
    const existingExercises = await database.get<ExerciseModel>('exercises').query().fetch();
    if (existingExercises.length > 0) {
      if (__DEV__) console.log(`Clearing ${existingExercises.length} existing exercises...`);
      await database.write(async () => {
        for (const exercise of existingExercises) {
          await exercise.destroyPermanently();
        }
      });
    }

    const exercisesModule = await import('@/../assets/data/exercises.json');
    const exercises = exercisesModule.default as ExerciseData[];
    const now = Date.now();

    // Batch insert in chunks for better performance
    const BATCH_SIZE = 100;
    let totalInserted = 0;

    for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
      const batch = exercises.slice(i, i + BATCH_SIZE);

      await database.write(async () => {
        const exercisesCollection = database.get<ExerciseModel>('exercises');

        for (const exercise of batch) {
          await exercisesCollection.create((record) => {
            // Cast _raw once to set fields not exposed by the typed model
            // (WatermelonDB _raw is the official way to set fields during create)
            const raw = record._raw as Record<string, unknown>;
            raw.id = exercise.exerciseId;
            record.exercisedbId = exercise.exerciseId;
            record.name = exercise.name;
            record.gifUrl = exercise.gifUrl;
            // Store arrays as JSON strings (WatermelonDB @json decorator will parse them)
            raw.body_parts = JSON.stringify(exercise.bodyParts);
            raw.target_muscles = JSON.stringify(exercise.targetMuscles);
            raw.secondary_muscles = JSON.stringify(exercise.secondaryMuscles);
            raw.equipments = JSON.stringify(exercise.equipments);
            raw.instructions = JSON.stringify(exercise.instructions);
            raw.created_at = now;
            raw.updated_at = now;
          });
        }
      });

      totalInserted += batch.length;
      if (__DEV__) console.log(`Seeded ${totalInserted}/${exercises.length} exercises`);
    }

    // Mark seeding complete
    mmkvStorage.setNumber(EXERCISE_SEED_VERSION_KEY, SEED_VERSION);

    if (__DEV__) console.log(`Exercise seeding complete: ${totalInserted} exercises`);
    return { success: true, count: totalInserted };
  } catch (error) {
    console.error('Exercise seeding failed:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Initialize exercises (check and seed if needed)
 * Call this during app startup
 */
export async function initializeExercises(): Promise<void> {
  const needsSeeding = await needsExerciseSeeding();

  if (needsSeeding) {
    if (__DEV__) console.log('First launch or update detected, seeding exercises...');
    const result = await seedExercises();

    if (!result.success) {
      throw new Error('Failed to seed exercises');
    }
  } else {
    if (__DEV__) console.log('Exercises already seeded');
  }
}
