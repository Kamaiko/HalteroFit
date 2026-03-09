/**
 * editDayHelpers - Unit tests
 *
 * Tests buildSavePayload — the transaction payload builder for edit-day saves.
 * isTempExerciseId, generateTempExerciseId, and createDayExerciseFromPicked
 * are trivial one-liners (string.startsWith, template literal, object literal)
 * and not tested directly.
 */

import { buildSavePayload } from '@/hooks/workout/editDayHelpers';
import type { PickedExercise } from '@/stores/exercises/exercisePickerStore';
import type { DayExercise } from '@/services/database/operations/plans';

// ── Factories ───────────────────────────────────────────────────────────

const makePickedExercise = (overrides?: Partial<PickedExercise>): PickedExercise => ({
  id: 'ex-1',
  name: 'bench press',
  body_parts: ['chest'],
  target_muscles: ['pectorals'],
  equipments: ['barbell'],
  gif_url: 'https://example.com/bench.gif',
  ...overrides,
});

const makeDayExercise = (id: string, orderIndex: number): DayExercise => ({
  id,
  plan_day_id: 'day-1',
  exercise_id: `exercise-${id}`,
  order_index: orderIndex,
  target_sets: 3,
  target_reps: 10,
  rest_timer_seconds: undefined,
  notes: undefined,
  created_at: 1700000000000,
  updated_at: 1700000000000,
  exercise: {
    id: `exercise-${id}`,
    name: `Exercise ${id}`,
    body_parts: ['chest'],
    target_muscles: ['pectorals'],
    equipments: ['barbell'],
  },
});

// ── buildSavePayload — name handling ────────────────────────────────────

describe('buildSavePayload', () => {
  const baseInput = {
    dayId: 'day-1',
    exercises: [] as DayExercise[],
    pendingAdds: [] as { tempId: string; exercise: PickedExercise }[],
    removedIds: new Set<string>(),
  };

  it('returns undefined when name is unchanged', () => {
    expect(
      buildSavePayload({ ...baseInput, dayName: 'Chest Day', initialName: 'Chest Day' }).name
    ).toBeUndefined();
  });

  it('returns trimmed name when value has changed', () => {
    expect(
      buildSavePayload({ ...baseInput, dayName: '  Back Day  ', initialName: 'Chest Day' }).name
    ).toBe('Back Day');
  });

  it('falls back to initialName when dayName is empty/whitespace', () => {
    expect(
      buildSavePayload({ ...baseInput, dayName: '   ', initialName: 'Chest Day' }).name
    ).toBeUndefined();
  });

  // ── buildSavePayload — exercise operations (data loss risk) ───────────

  it('maps pending adds with current order index from exercises list', () => {
    const tempId = 'temp_123_0';
    const exercises = [
      makeDayExercise('real-1', 0),
      { ...makeDayExercise(tempId, 1), exercise_id: 'ex-new' },
    ];

    const result = buildSavePayload({
      ...baseInput,
      dayName: 'Day',
      initialName: 'Day',
      exercises,
      pendingAdds: [{ tempId, exercise: makePickedExercise({ id: 'ex-new' }) }],
    });

    expect(result.addedExercises).toEqual([{ exercise_id: 'ex-new', order_index: 1 }]);
  });

  it('filters out pending adds that were later removed', () => {
    const result = buildSavePayload({
      ...baseInput,
      dayName: 'Day',
      initialName: 'Day',
      exercises: [makeDayExercise('real-1', 0)],
      pendingAdds: [{ tempId: 'temp_gone', exercise: makePickedExercise() }],
    });

    expect(result.addedExercises).toEqual([]);
  });

  it('computes reordered exercises for persisted (non-temp) IDs only', () => {
    const exercises = [
      makeDayExercise('real-2', 0),
      makeDayExercise('temp_123_0', 1),
      makeDayExercise('real-1', 2),
    ];

    const result = buildSavePayload({
      ...baseInput,
      dayName: 'Day',
      initialName: 'Day',
      exercises,
    });

    expect(result.reorderedExercises).toEqual([
      { id: 'real-2', order_index: 0 },
      { id: 'real-1', order_index: 2 },
    ]);
  });

  it('reorder + add indices form a complete set (no conflicts or gaps)', () => {
    const tempId = 'temp_123_0';
    const exercises = [
      makeDayExercise('real-1', 0),
      { ...makeDayExercise(tempId, 1), exercise_id: 'ex-new' },
      makeDayExercise('real-2', 2),
    ];

    const result = buildSavePayload({
      ...baseInput,
      dayName: 'Day',
      initialName: 'Day',
      exercises,
      pendingAdds: [{ tempId, exercise: makePickedExercise({ id: 'ex-new' }) }],
    });

    // Reordered: real-1→0, real-2→2 (non-contiguous, gap at 1)
    // Added: ex-new→1 (fills the gap)
    const allIndices = [
      ...result.reorderedExercises.map((e) => e.order_index),
      ...result.addedExercises.map((e) => e.order_index),
    ].sort((a, b) => a - b);

    expect(allIndices).toEqual([0, 1, 2]);
  });
});
