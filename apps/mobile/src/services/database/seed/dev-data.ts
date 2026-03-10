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

import { database } from '../local';
import { exerciseUuid } from '../local/generateId';
import type WorkoutPlan from '../local/models/WorkoutPlan';
import type PlanDay from '../local/models/PlanDay';
import type PlanDayExercise from '../local/models/PlanDayExercise';

// Must match DEV_MOCK_USER.id in authStore.ts
const DEV_USER_ID = 'dev-user-123';

// ── Seed plan structure ─────────────────────────────────────────────────

interface SeedExercise {
  exerciseDbId: string;
  targetSets: number;
  targetReps: number;
  restTimerSeconds?: number;
}

interface SeedDay {
  name: string;
  dayOfWeek: string;
  exercises: SeedExercise[];
}

const SEED_DAYS: SeedDay[] = [
  {
    name: 'Push',
    dayOfWeek: 'MON',
    exercises: [
      { exerciseDbId: 'EIeI8Vf', targetSets: 3, targetReps: 10, restTimerSeconds: 120 }, // Barbell Bench Press
      { exerciseDbId: 'ns0SIbU', targetSets: 3, targetReps: 12, restTimerSeconds: 90 }, // Dumbbell Incline Bench Press
      { exerciseDbId: 'A6wtbuL', targetSets: 3, targetReps: 8, restTimerSeconds: 90 }, // Dumbbell Standing Overhead Press
      { exerciseDbId: 'w4dLzSx', targetSets: 3, targetReps: 15, restTimerSeconds: 60 }, // Cable One Arm Decline Chest Fly
      { exerciseDbId: 'qRZ5S1N', targetSets: 3, targetReps: 12, restTimerSeconds: 60 }, // Cable One Arm Tricep Pushdown
    ],
  },
  {
    name: 'Pull',
    dayOfWeek: 'WED',
    exercises: [
      { exerciseDbId: 'eZyBC3j', targetSets: 3, targetReps: 10, restTimerSeconds: 120 }, // Barbell Bent Over Row
      { exerciseDbId: '0V2YQjW', targetSets: 3, targetReps: 8, restTimerSeconds: 90 }, // Pull Up (neutral Grip)
      { exerciseDbId: 'LEprlgG', targetSets: 3, targetReps: 12, restTimerSeconds: 90 }, // Cable Lat Pulldown Full Range Of Motion
      { exerciseDbId: 'wqNPGCg', targetSets: 3, targetReps: 15, restTimerSeconds: 60 }, // Cable Rear Delt Row (with Rope)
      { exerciseDbId: '25GPyDY', targetSets: 3, targetReps: 12, restTimerSeconds: 60 }, // Barbell Curl
    ],
  },
  {
    name: 'Legs',
    dayOfWeek: 'FRI',
    exercises: [
      { exerciseDbId: 'qXTaZnJ', targetSets: 4, targetReps: 8, restTimerSeconds: 150 }, // Barbell Full Squat
      { exerciseDbId: 'wQ2c4XD', targetSets: 3, targetReps: 10, restTimerSeconds: 120 }, // Barbell Romanian Deadlift
      { exerciseDbId: 'yn2lLSI', targetSets: 3, targetReps: 12, restTimerSeconds: 90 }, // Sled 45° Leg Press
      { exerciseDbId: '17lJ1kr', targetSets: 3, targetReps: 12, restTimerSeconds: 60 }, // Lever Lying Leg Curl
      { exerciseDbId: '8ozhUIZ', targetSets: 4, targetReps: 15, restTimerSeconds: 60 }, // Barbell Standing Calf Raise
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
    if (__DEV__) console.log('Dev seed: skipped (plans already exist)');
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

      for (const [exIndex, seedEx] of seedDay.exercises.entries()) {
        exerciseRecords.push(
          exercisesCollection.prepareCreate((record) => {
            record.planDayId = day.id;
            record.exerciseId = exerciseUuid(seedEx.exerciseDbId);
            record.orderIndex = exIndex;
            record.targetSets = seedEx.targetSets;
            record.targetReps = seedEx.targetReps;
            record.restTimerSeconds = seedEx.restTimerSeconds;
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
    console.log(
      `Dev seed: created "Push / Pull / Legs" plan with ${SEED_DAYS.length} days, ` +
        `${SEED_DAYS.reduce((sum, d) => sum + d.exercises.length, 0)} exercises`
    );
  }
}
