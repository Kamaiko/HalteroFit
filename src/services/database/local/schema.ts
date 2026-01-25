/**
 * WatermelonDB Schema
 *
 * Defines database structure for offline-first workout tracking.
 * Matches Supabase schema for seamless sync.
 *
 * @see docs/DATABASE.md for complete schema documentation
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 8, // V8: Added workout plans/templates (workout_plans, plan_days, plan_day_exercises)
  tables: [
    // Users table
    tableSchema({
      name: 'users',
      columns: [
        { name: 'email', type: 'string' },
        { name: 'preferred_unit', type: 'string' }, // 'kg' or 'lbs'
        { name: 'default_rest_timer_seconds', type: 'number', isOptional: true }, // Global rest timer default
        // NOTE: nutrition_phase removed per SCOPE-SIMPLIFICATION.md (not in MVP scope)
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Exercises table (1,500 from GitHub ExerciseDB dataset - read-only)
    // NOTE: GitHub dataset structure (8 fields with animated GIFs)
    // NOTE: Custom exercises removed in MVP (ADR-017)
    tableSchema({
      name: 'exercises',
      columns: [
        // GitHub ExerciseDB dataset fields (8 total)
        { name: 'exercisedb_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'body_parts', type: 'string' }, // JSON array: ["chest"]
        { name: 'target_muscles', type: 'string' }, // JSON array: ["pectorals"]
        { name: 'secondary_muscles', type: 'string' }, // JSON array: ["triceps", "deltoids"]
        { name: 'equipments', type: 'string' }, // JSON array: ["barbell"]
        { name: 'instructions', type: 'string' }, // JSON array: step-by-step guide
        { name: 'gif_url', type: 'string', isOptional: true }, // Animated exercise GIF

        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Workouts table (logged workout sessions)
    tableSchema({
      name: 'workouts',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'plan_id', type: 'string', isOptional: true, isIndexed: true }, // Link to source plan
        { name: 'plan_day_id', type: 'string', isOptional: true, isIndexed: true }, // Link to source day
        { name: 'started_at', type: 'number', isIndexed: true },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'duration_seconds', type: 'number', isOptional: true },
        { name: 'title', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Workout exercises (junction table for ordering)
    tableSchema({
      name: 'workout_exercises',
      columns: [
        { name: 'workout_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'order_index', type: 'number' },
        { name: 'superset_group', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'target_sets', type: 'number', isOptional: true },
        { name: 'target_reps', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Exercise sets (actual performance data)
    tableSchema({
      name: 'exercise_sets',
      columns: [
        { name: 'workout_exercise_id', type: 'string', isIndexed: true },
        { name: 'set_number', type: 'number' },
        { name: 'weight', type: 'number', isOptional: true },
        { name: 'weight_unit', type: 'string', isOptional: true },
        { name: 'reps', type: 'number', isOptional: true },
        { name: 'duration_seconds', type: 'number', isOptional: true },
        { name: 'distance_meters', type: 'number', isOptional: true },
        { name: 'rpe', type: 'number', isOptional: true }, // Rate of Perceived Exertion (1-10)
        { name: 'rir', type: 'number', isOptional: true }, // Reps in Reserve (0-5)
        { name: 'rest_time_seconds', type: 'number', isOptional: true },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'is_warmup', type: 'boolean' },
        { name: 'is_failure', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ========================================
    // WORKOUT PLANS / TEMPLATES (v8)
    // ========================================

    // Workout plans (reusable templates)
    tableSchema({
      name: 'workout_plans',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'is_active', type: 'boolean' }, // Only one plan active at a time
        { name: 'cover_image_url', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Plan days (days within a plan)
    tableSchema({
      name: 'plan_days',
      columns: [
        { name: 'plan_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' }, // "Day 1 Chest & Triceps"
        { name: 'day_of_week', type: 'string', isOptional: true }, // "MON", "TUE", etc.
        { name: 'order_index', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Plan day exercises (exercise templates within a day)
    tableSchema({
      name: 'plan_day_exercises',
      columns: [
        { name: 'plan_day_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'order_index', type: 'number' },
        { name: 'target_sets', type: 'number' }, // Default: 3
        { name: 'target_reps', type: 'number' }, // Default: 10
        { name: 'rest_timer_seconds', type: 'number', isOptional: true }, // Exercise-specific timer
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
