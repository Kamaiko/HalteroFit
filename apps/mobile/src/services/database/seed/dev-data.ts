/**
 * Dev User Seed Data
 *
 * Populates the dev user with a realistic workout plan so the app
 * isn't empty when testing in dev mode. Only runs when no plans
 * exist for the dev user (idempotent).
 *
 * Called from _layout.tsx (startup) and sign-in.tsx ("Continue as Dev User").
 * Must run AFTER initializeExercises() — references seeded exercise IDs.
 */

import { Q } from '@nozbe/watermelondb';

import { DEFAULT_TARGET_REPS, DEFAULT_TARGET_SETS } from '@/constants';
import { DEV_MOCK_USER } from '@/stores/auth/authStore';
import { database } from '../local';
import { exerciseUuid } from '../local/generateId';
import type WorkoutPlan from '../local/models/WorkoutPlan';
import type PlanDay from '../local/models/PlanDay';
import type PlanDayExercise from '../local/models/PlanDayExercise';

const DEV_USER_ID = DEV_MOCK_USER.id;

// ── Seed plan structure ─────────────────────────────────────────────────
// TODO: Add varied targetSets/targetReps per exercise when custom sets/reps feature is implemented
// All exercises use DEFAULT_TARGET_SETS (3) × DEFAULT_TARGET_REPS (10)
// to match the UI display logic in TimelineDayCard which calculates
// total sets as exerciseCount × DEFAULT_TARGET_SETS.

interface SeedDay {
  name: string;
  dayOfWeek: string;
  exercises: string[]; // exerciseDb IDs
}

const SEED_DAYS: SeedDay[] = [
  {
    name: 'Push',
    dayOfWeek: 'MON',
    exercises: [
      'EIeI8Vf', // Barbell Bench Press
      'ns0SIbU', // Dumbbell Incline Bench Press
      'A6wtbuL', // Dumbbell Standing Overhead Press
      'w4dLzSx', // Cable One Arm Decline Chest Fly
      'qRZ5S1N', // Cable One Arm Tricep Pushdown
    ],
  },
  {
    name: 'Pull',
    dayOfWeek: 'WED',
    exercises: [
      'eZyBC3j', // Barbell Bent Over Row
      '0V2YQjW', // Pull Up (neutral Grip)
      'LEprlgG', // Cable Lat Pulldown Full Range Of Motion
      'wqNPGCg', // Cable Rear Delt Row (with Rope)
      '25GPyDY', // Barbell Curl
    ],
  },
  {
    name: 'Legs',
    dayOfWeek: 'FRI',
    exercises: [
      'qXTaZnJ', // Barbell Full Squat
      'wQ2c4XD', // Barbell Romanian Deadlift
      'yn2lLSI', // Sled 45° Leg Press
      '17lJ1kr', // Lever Lying Leg Curl
      '8ozhUIZ', // Barbell Standing Calf Raise
    ],
  },
];

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Seed the dev user with a "Push / Pull / Legs" plan.
 * Idempotent — skips if the dev user already has plans.
 */
export async function seedDevData(): Promise<void> {
  const existingCount = await database
    .get<WorkoutPlan>('workout_plans')
    .query(Q.where('user_id', DEV_USER_ID))
    .fetchCount();

  if (existingCount > 0) {
    if (__DEV__) console.warn('Dev seed: skipped (plans already exist)');
    return;
  }

  const now = Date.now();
  const plansCollection = database.get<WorkoutPlan>('workout_plans');
  const daysCollection = database.get<PlanDay>('plan_days');
  const exercisesCollection = database.get<PlanDayExercise>('plan_day_exercises');

  await database.write(async () => {
    // Prepare plan
    const plan = plansCollection.prepareCreate((record) => {
      record.userId = DEV_USER_ID;
      record.name = 'Push / Pull / Legs';
      record.isActive = true;
      const raw = record._raw as Record<string, unknown>;
      raw.created_at = now;
      raw.updated_at = now;
    });

    // Prepare days + exercises
    const dayRecords: PlanDay[] = [];
    const exerciseRecords: PlanDayExercise[] = [];

    for (const [dayIndex, seedDay] of SEED_DAYS.entries()) {
      const day = daysCollection.prepareCreate((record) => {
        record.planId = plan.id;
        record.name = seedDay.name;
        record.dayOfWeek = seedDay.dayOfWeek;
        record.orderIndex = dayIndex;
        const raw = record._raw as Record<string, unknown>;
        raw.created_at = now;
        raw.updated_at = now;
      });
      dayRecords.push(day);

      for (const [exIndex, exerciseDbId] of seedDay.exercises.entries()) {
        exerciseRecords.push(
          exercisesCollection.prepareCreate((record) => {
            record.planDayId = day.id;
            record.exerciseId = exerciseUuid(exerciseDbId);
            record.orderIndex = exIndex;
            record.targetSets = DEFAULT_TARGET_SETS;
            record.targetReps = DEFAULT_TARGET_REPS;
            const raw = record._raw as Record<string, unknown>;
            raw.created_at = now;
            raw.updated_at = now;
          })
        );
      }
    }

    await database.batch(plan, ...dayRecords, ...exerciseRecords);
  });

  // Mark as 'synced' so these records are never pushed to Supabase
  await database.adapter.unsafeExecute({
    sqls: [
      [
        `UPDATE workout_plans SET _status = 'synced' WHERE user_id = '${DEV_USER_ID}' AND _status = 'created'`,
        [],
      ],
      [
        `UPDATE plan_days SET _status = 'synced' WHERE _status = 'created' AND plan_id IN (SELECT id FROM workout_plans WHERE user_id = '${DEV_USER_ID}')`,
        [],
      ],
      [
        `UPDATE plan_day_exercises SET _status = 'synced' WHERE _status = 'created' AND plan_day_id IN (SELECT id FROM plan_days WHERE plan_id IN (SELECT id FROM workout_plans WHERE user_id = '${DEV_USER_ID}'))`,
        [],
      ],
    ],
  });

  if (__DEV__) {
    console.warn(
      `Dev seed: created "Push / Pull / Legs" plan with ${SEED_DAYS.length} days, ` +
        `${SEED_DAYS.reduce((sum, d) => sum + d.exercises.length, 0)} exercises`
    );
  }
}
