/**
 * editDayHelpers - Unit tests
 *
 * Tests the pure helper functions extracted from useEditDay for testability.
 */

import {
  TEMP_EXERCISE_ID_PREFIX,
  isTempExerciseId,
  generateTempExerciseId,
  createDayExerciseFromPicked,
  buildSavePayload,
} from '@/hooks/workout/editDayHelpers';
import { DEFAULT_TARGET_SETS, DEFAULT_TARGET_REPS } from '@/constants';
import type { PickedExercise } from '@/stores/exercises/exercisePickerStore';
import type { DayExercise } from '@/components/workout/DayExerciseCard';

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

// ── isTempExerciseId ────────────────────────────────────────────────────

describe('isTempExerciseId', () => {
  it('returns true for IDs starting with temp prefix', () => {
    expect(isTempExerciseId(`${TEMP_EXERCISE_ID_PREFIX}12345_0`)).toBe(true);
  });

  it('returns false for regular UUIDs', () => {
    expect(isTempExerciseId('abc-123-def')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isTempExerciseId('')).toBe(false);
  });

  it('returns false when prefix appears mid-string', () => {
    expect(isTempExerciseId(`id_${TEMP_EXERCISE_ID_PREFIX}123`)).toBe(false);
  });
});

// ── generateTempExerciseId ──────────────────────────────────────────────

describe('generateTempExerciseId', () => {
  it('starts with the temp prefix', () => {
    const id = generateTempExerciseId(0);
    expect(id.startsWith(TEMP_EXERCISE_ID_PREFIX)).toBe(true);
  });

  it('includes the index in the ID', () => {
    const id = generateTempExerciseId(5);
    expect(id).toMatch(/_5$/);
  });

  it('is recognized as temporary by isTempExerciseId', () => {
    expect(isTempExerciseId(generateTempExerciseId(0))).toBe(true);
  });

  it('generates unique IDs for different indices', () => {
    const id1 = generateTempExerciseId(0);
    const id2 = generateTempExerciseId(1);
    expect(id1).not.toBe(id2);
  });
});

// ── createDayExerciseFromPicked ─────────────────────────────────────────

describe('createDayExerciseFromPicked', () => {
  const picked = makePickedExercise();
  const dayId = 'day-1';
  const orderIndex = 2;
  const tempId = 'temp_12345_0';

  it('maps picked exercise fields to DayExercise', () => {
    const result = createDayExerciseFromPicked(picked, dayId, orderIndex, tempId);

    expect(result.id).toBe(tempId);
    expect(result.plan_day_id).toBe(dayId);
    expect(result.exercise_id).toBe(picked.id);
    expect(result.order_index).toBe(orderIndex);
  });

  it('uses default target sets and reps from constants', () => {
    const result = createDayExerciseFromPicked(picked, dayId, orderIndex, tempId);

    expect(result.target_sets).toBe(DEFAULT_TARGET_SETS);
    expect(result.target_reps).toBe(DEFAULT_TARGET_REPS);
  });

  it('sets rest_timer_seconds and notes to undefined', () => {
    const result = createDayExerciseFromPicked(picked, dayId, orderIndex, tempId);

    expect(result.rest_timer_seconds).toBeUndefined();
    expect(result.notes).toBeUndefined();
  });

  it('nests exercise metadata correctly', () => {
    const result = createDayExerciseFromPicked(picked, dayId, orderIndex, tempId);

    expect(result.exercise).toEqual({
      id: picked.id,
      name: picked.name,
      body_parts: picked.body_parts,
      target_muscles: picked.target_muscles,
      equipments: picked.equipments,
      gif_url: picked.gif_url,
    });
  });
});

// ── buildSavePayload ────────────────────────────────────────────────────

describe('buildSavePayload', () => {
  it('returns unchanged name as undefined (no rename)', () => {
    const result = buildSavePayload({
      dayId: 'day-1',
      dayName: 'Chest Day',
      initialName: 'Chest Day',
      exercises: [],
      pendingAdds: [],
      removedIds: new Set(),
    });

    expect(result.name).toBeUndefined();
  });

  it('returns new name when it differs from initial', () => {
    const result = buildSavePayload({
      dayId: 'day-1',
      dayName: 'Upper Body',
      initialName: 'Chest Day',
      exercises: [],
      pendingAdds: [],
      removedIds: new Set(),
    });

    expect(result.name).toBe('Upper Body');
  });

  it('trims whitespace from name', () => {
    const result = buildSavePayload({
      dayId: 'day-1',
      dayName: '  Back Day  ',
      initialName: 'Chest Day',
      exercises: [],
      pendingAdds: [],
      removedIds: new Set(),
    });

    expect(result.name).toBe('Back Day');
  });

  it('falls back to initialName when dayName is empty/whitespace', () => {
    const result = buildSavePayload({
      dayId: 'day-1',
      dayName: '   ',
      initialName: 'Chest Day',
      exercises: [],
      pendingAdds: [],
      removedIds: new Set(),
    });

    expect(result.name).toBeUndefined();
  });

  it('converts removedIds set to array', () => {
    const result = buildSavePayload({
      dayId: 'day-1',
      dayName: 'Day',
      initialName: 'Day',
      exercises: [],
      pendingAdds: [],
      removedIds: new Set(['id-1', 'id-2']),
    });

    expect(result.removedExerciseIds).toEqual(['id-1', 'id-2']);
  });

  it('maps pending adds with current order index from exercises list', () => {
    const tempId = 'temp_123_0';
    const exercises = [
      makeDayExercise('real-1', 0),
      { ...makeDayExercise(tempId, 1), exercise_id: 'ex-new' },
    ];

    const result = buildSavePayload({
      dayId: 'day-1',
      dayName: 'Day',
      initialName: 'Day',
      exercises,
      pendingAdds: [{ tempId, exercise: makePickedExercise({ id: 'ex-new' }) }],
      removedIds: new Set(),
    });

    expect(result.addedExercises).toEqual([{ exercise_id: 'ex-new', order_index: 1 }]);
  });

  it('filters out pending adds that were later removed', () => {
    const result = buildSavePayload({
      dayId: 'day-1',
      dayName: 'Day',
      initialName: 'Day',
      exercises: [makeDayExercise('real-1', 0)],
      pendingAdds: [{ tempId: 'temp_gone', exercise: makePickedExercise() }],
      removedIds: new Set(),
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
      dayId: 'day-1',
      dayName: 'Day',
      initialName: 'Day',
      exercises,
      pendingAdds: [],
      removedIds: new Set(),
    });

    expect(result.reorderedExercises).toEqual([
      { id: 'real-2', order_index: 0 },
      { id: 'real-1', order_index: 2 },
    ]);
  });
});
