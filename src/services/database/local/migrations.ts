/**
 * WatermelonDB Local Database Migrations
 *
 * Handles schema version upgrades for local SQLite database.
 * These migrations run automatically when app detects schema version mismatch.
 *
 * IMPORTANT: _changed and _status columns are managed automatically by WatermelonDB
 * when using the sync protocol. They do NOT need to be added via migrations.
 *
 * Current schema version: 8
 *
 * Migration History:
 * - v1-v4: Initial schema development
 * - v5: Consolidated schema (merged 8 incremental migrations)
 * - v6: Removed description, difficulty, category (not in GitHub dataset)
 * - v7: Added gif_url (GitHub ExerciseDB provides animated GIFs)
 * - v8: Added workout plans/templates (workout_plans, plan_days, plan_day_exercises)
 *       Added plan_id, plan_day_id to workouts
 *       Added default_rest_timer_seconds to users
 *
 * NOTE: v2-v4 are placeholder migrations (no steps).
 *
 * @see https://nozbe.github.io/WatermelonDB/Advanced/Migrations.html
 * @see https://nozbe.github.io/WatermelonDB/Advanced/Sync.html
 */

import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        // No migration steps - fresh installs start at current version
      ],
    },
    {
      toVersion: 3,
      steps: [
        // No migration steps - fresh installs start at current version
      ],
    },
    {
      toVersion: 4,
      steps: [
        // No migration steps - fresh installs start at current version
      ],
    },
    {
      toVersion: 5,
      steps: [
        // Placeholder - fresh installs start at current version
      ],
    },
    {
      toVersion: 6,
      steps: [
        // No steps needed - WatermelonDB ignores columns not in schema
        // Removed: description, difficulty, category (not in GitHub ExerciseDB dataset)
      ],
    },
    {
      toVersion: 7,
      steps: [
        // No steps needed - WatermelonDB will create gif_url column on next sync
        // Added: gif_url (GitHub ExerciseDB provides animated exercise GIFs)
      ],
    },
    {
      toVersion: 8,
      steps: [
        // Add default_rest_timer_seconds to users
        addColumns({
          table: 'users',
          columns: [{ name: 'default_rest_timer_seconds', type: 'number', isOptional: true }],
        }),

        // Add plan references to workouts
        addColumns({
          table: 'workouts',
          columns: [
            { name: 'plan_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'plan_day_id', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),

        // Create workout_plans table
        createTable({
          name: 'workout_plans',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'name', type: 'string' },
            { name: 'is_active', type: 'boolean' },
            { name: 'cover_image_url', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),

        // Create plan_days table
        createTable({
          name: 'plan_days',
          columns: [
            { name: 'plan_id', type: 'string', isIndexed: true },
            { name: 'name', type: 'string' },
            { name: 'day_of_week', type: 'string', isOptional: true },
            { name: 'order_index', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),

        // Create plan_day_exercises table
        createTable({
          name: 'plan_day_exercises',
          columns: [
            { name: 'plan_day_id', type: 'string', isIndexed: true },
            { name: 'exercise_id', type: 'string', isIndexed: true },
            { name: 'order_index', type: 'number' },
            { name: 'target_sets', type: 'number' },
            { name: 'target_reps', type: 'number' },
            { name: 'rest_timer_seconds', type: 'number', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
});
