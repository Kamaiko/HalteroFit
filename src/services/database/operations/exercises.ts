/**
 * Exercise CRUD Operations - WatermelonDB Implementation
 *
 * Read-only operations for the exercise library.
 * Custom exercises are deferred to Phase 3+ (ADR-017).
 */

import { Q } from '@nozbe/watermelondb';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { database } from '../local';
import ExerciseModel from '../local/models/Exercise';
import { DatabaseError } from '@/utils/errors';
import { DEFAULT_PAGE_SIZE } from '@/constants';

// ============================================================================
// Types
// ============================================================================

export interface Exercise {
  id: string;
  exercisedb_id: string;
  name: string;
  body_parts: string[];
  target_muscles: string[];
  secondary_muscles: string[];
  equipments: string[];
  instructions: string[];
  gif_url?: string;
  created_at: number;
  updated_at: number;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build WatermelonDB filter queries for exercise search/filtering.
 * Shared between getExercises() and getExerciseCount().
 */
function buildExerciseFilterQueries(options: {
  search?: string;
  bodyPart?: string;
  targetMuscle?: string;
}): Q.Clause[] {
  const { search, bodyPart, targetMuscle } = options;
  const queries: Q.Clause[] = [];

  // Search by name (case-insensitive, word-order independent)
  if (search && search.trim().length > 0) {
    const words = search.trim().split(/\s+/);
    for (const word of words) {
      queries.push(Q.where('name', Q.like(`%${Q.sanitizeLikeString(word)}%`)));
    }
  }

  // Filter by body part (stored as JSON array, search within string)
  if (bodyPart && bodyPart.trim().length > 0) {
    queries.push(Q.where('body_parts', Q.like(`%"${Q.sanitizeLikeString(bodyPart)}"%`)));
  }

  // Filter by target muscle (stored as JSON array, search within string)
  if (targetMuscle && targetMuscle.trim().length > 0) {
    queries.push(Q.where('target_muscles', Q.like(`%"${Q.sanitizeLikeString(targetMuscle)}"%`)));
  }

  return queries;
}

function exerciseToPlain(exercise: ExerciseModel): Exercise {
  return {
    id: exercise.id,
    exercisedb_id: exercise.exercisedbId,
    name: exercise.name,
    body_parts: exercise.bodyParts,
    target_muscles: exercise.targetMuscles,
    secondary_muscles: exercise.secondaryMuscles,
    equipments: exercise.equipments,
    instructions: exercise.instructions,
    gif_url: exercise.gifUrl ?? undefined,
    created_at: exercise.createdAt.getTime(),
    updated_at: exercise.updatedAt.getTime(),
  };
}

// ============================================================================
// READ Operations
// ============================================================================

/**
 * Get exercise by ID (Promise)
 */
export async function getExerciseById(id: string): Promise<Exercise> {
  try {
    const exercise = await database.get<ExerciseModel>('exercises').find(id);
    return exerciseToPlain(exercise);
  } catch (error) {
    throw new DatabaseError(
      'Unable to load exercise. Please try again.',
      `Failed to get exercise by ID ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Observe exercise by ID (Observable)
 */
export function observeExercise(id: string): Observable<Exercise> {
  return database.get<ExerciseModel>('exercises').findAndObserve(id).pipe(map(exerciseToPlain));
}

export interface ExerciseFilterOptions {
  search?: string;
  bodyPart?: string;
  targetMuscle?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get all exercises (Promise)
 * With optional search, filters, and pagination
 */
export async function getExercises(options?: ExerciseFilterOptions): Promise<Exercise[]> {
  try {
    const { search, bodyPart, targetMuscle, limit = DEFAULT_PAGE_SIZE, offset = 0 } = options ?? {};

    const queries = buildExerciseFilterQueries({ search, bodyPart, targetMuscle });
    queries.push(Q.sortBy('name', Q.asc));
    queries.push(Q.take(limit));
    queries.push(Q.skip(offset));

    const exercises = await database
      .get<ExerciseModel>('exercises')
      .query(...queries)
      .fetch();

    return exercises.map(exerciseToPlain);
  } catch (error) {
    throw new DatabaseError(
      'Unable to load exercises. Please try again.',
      `Failed to get exercises: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Observe all exercises (Observable)
 * With optional search
 */
export function observeExercises(options?: {
  search?: string;
  limit?: number;
}): Observable<Exercise[]> {
  const { search, limit = DEFAULT_PAGE_SIZE } = options ?? {};

  const queries: Q.Clause[] = [];

  if (search && search.trim().length > 0) {
    queries.push(Q.where('name', Q.like(`%${Q.sanitizeLikeString(search)}%`)));
  }

  queries.push(Q.sortBy('name', Q.asc));
  queries.push(Q.take(limit));

  return database
    .get<ExerciseModel>('exercises')
    .query(...queries)
    .observe()
    .pipe(map((exercises) => exercises.map(exerciseToPlain)));
}

/**
 * Get exercise count (with optional filters)
 */
export async function getExerciseCount(options?: {
  search?: string;
  bodyPart?: string;
  targetMuscle?: string;
}): Promise<number> {
  try {
    const { search, bodyPart, targetMuscle } = options ?? {};
    const queries = buildExerciseFilterQueries({ search, bodyPart, targetMuscle });

    return await database
      .get<ExerciseModel>('exercises')
      .query(...queries)
      .fetchCount();
  } catch (error) {
    throw new DatabaseError(
      'Unable to count exercises. Please try again.',
      `Failed to count exercises: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Search exercises by name (Promise)
 * Convenience wrapper around getExercises
 */
export async function searchExercises(query: string, limit = 50): Promise<Exercise[]> {
  return getExercises({ search: query, limit });
}
