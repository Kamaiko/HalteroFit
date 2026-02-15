/**
 * Muscle mapping utilities - Unit tests
 *
 * Tests getMuscleHighlighterData, getTargetMuscleGroupId, and
 * getFirstMuscleGroupId from src/utils/muscles.ts
 */

import {
  getMuscleHighlighterData,
  getTargetMuscleGroupId,
  getFirstMuscleGroupId,
} from '@/utils/muscles';
import { computeDominantMuscleGroup } from '@/services/database/operations/plans/mappers';

// ── Basic mapping ───────────────────────────────────────────────────────

describe('getMuscleHighlighterData', () => {
  it('maps target muscles to intensity 1', () => {
    const result = getMuscleHighlighterData(['pectorals'], []);
    expect(result.data).toEqual([{ slug: 'chest', intensity: 1 }]);
    expect(result.hasAnyMuscle).toBe(true);
  });

  it('maps secondary muscles to intensity 2', () => {
    const result = getMuscleHighlighterData([], ['triceps']);
    expect(result.data).toEqual([{ slug: 'triceps', intensity: 2 }]);
  });

  it('maps both target and secondary muscles', () => {
    const result = getMuscleHighlighterData(['pectorals'], ['triceps', 'deltoids']);
    expect(result.data).toEqual([
      { slug: 'chest', intensity: 1 },
      { slug: 'triceps', intensity: 2 },
      { slug: 'deltoids', intensity: 2 },
    ]);
  });

  // ── Deduplication & precedence ──────────────────────────────────────

  it('gives target precedence when muscle appears in both arrays', () => {
    const result = getMuscleHighlighterData(['biceps'], ['biceps']);
    expect(result.data).toEqual([{ slug: 'biceps', intensity: 1 }]);
  });

  it('deduplicates when multiple names map to same slug', () => {
    const result = getMuscleHighlighterData([], ['traps', 'trapezius']);
    const trapEntries = result.data.filter((d) => d.slug === 'trapezius');
    expect(trapEntries).toHaveLength(1);
  });

  // ── Unmapped muscles ────────────────────────────────────────────────

  it('filters unmappable muscles', () => {
    const result = getMuscleHighlighterData(['cardiovascular system'], []);
    expect(result.data).toEqual([]);
    expect(result.hasAnyMuscle).toBe(false);
  });

  it('returns mapped muscles even when some are unmappable', () => {
    const result = getMuscleHighlighterData(['pectorals', 'spine'], []);
    expect(result.data).toEqual([{ slug: 'chest', intensity: 1 }]);
    expect(result.hasAnyMuscle).toBe(true);
  });

  // ── Empty arrays ────────────────────────────────────────────────────

  it('handles empty arrays', () => {
    const result = getMuscleHighlighterData([], []);
    expect(result.data).toEqual([]);
    expect(result.hasAnyMuscle).toBe(false);
  });

  // ── All target muscle names from ExerciseDB ─────────────────────────

  it('maps all mappable ExerciseDB target muscles', () => {
    const mappableTargets = [
      'abs',
      'adductors',
      'biceps',
      'calves',
      'delts',
      'forearms',
      'glutes',
      'hamstrings',
      'lats',
      'pectorals',
      'quads',
      'traps',
      'triceps',
      'upper back',
      'abductors',
      'serratus anterior',
      'levator scapulae',
    ];

    const result = getMuscleHighlighterData(mappableTargets, []);
    // 17 inputs but 15 unique slugs (lats/upper back → upper-back, glutes/abductors → gluteal)
    expect(result.data.length).toBe(15);
    expect(result.data.every((d) => d.intensity === 1)).toBe(true);
    expect(result.hasAnyMuscle).toBe(true);
  });

  // ── Direct matches for ankles, feet, hands ────────────────────────

  it('maps ankles, feet, and hands (direct slug matches)', () => {
    const result = getMuscleHighlighterData([], ['ankles', 'feet', 'hands']);
    expect(result.data).toEqual([
      { slug: 'ankles', intensity: 2 },
      { slug: 'feet', intensity: 2 },
      { slug: 'hands', intensity: 2 },
    ]);
  });

  // ── Approximation mappings ────────────────────────────────────────

  it('maps wrist/grip muscles to forearm', () => {
    const result = getMuscleHighlighterData(
      [],
      ['wrist extensors', 'wrist flexors', 'wrists', 'grip muscles']
    );
    const forearmEntries = result.data.filter((d) => d.slug === 'forearm');
    expect(forearmEntries).toHaveLength(1);
  });

  it('maps hip flexors to quadriceps', () => {
    const result = getMuscleHighlighterData([], ['hip flexors']);
    expect(result.data).toEqual([{ slug: 'quadriceps', intensity: 2 }]);
  });

  it('maps rotator cuff to deltoids', () => {
    const result = getMuscleHighlighterData([], ['rotator cuff']);
    expect(result.data).toEqual([{ slug: 'deltoids', intensity: 2 }]);
  });

  it('maps ankle stabilizers to ankles', () => {
    const result = getMuscleHighlighterData([], ['ankle stabilizers']);
    expect(result.data).toEqual([{ slug: 'ankles', intensity: 2 }]);
  });

  // ── Case insensitivity ──────────────────────────────────────────────

  it('handles case-insensitive muscle names', () => {
    const result = getMuscleHighlighterData(['Pectorals'], []);
    expect(result.data).toEqual([{ slug: 'chest', intensity: 1 }]);
  });

  it('handles whitespace in muscle names', () => {
    const result = getMuscleHighlighterData([' pectorals '], []);
    expect(result.data).toEqual([{ slug: 'chest', intensity: 1 }]);
  });
});

// ── getTargetMuscleGroupId ──────────────────────────────────────────────

describe('getTargetMuscleGroupId', () => {
  it('maps ExerciseDB muscles to group IDs (case-insensitive, trimmed)', () => {
    expect(getTargetMuscleGroupId('pectorals')).toBe('chest');
    expect(getTargetMuscleGroupId('delts')).toBe('shoulder');
    expect(getTargetMuscleGroupId('lats')).toBe('back');
    expect(getTargetMuscleGroupId('upper back')).toBe('back');
    expect(getTargetMuscleGroupId('adductors')).toBe('quads');
    expect(getTargetMuscleGroupId('abductors')).toBe('glutes');
    // Case-insensitive + whitespace
    expect(getTargetMuscleGroupId(' DELTS ')).toBe('shoulder');
    // Unmappable
    expect(getTargetMuscleGroupId('cardiovascular system')).toBeNull();
    expect(getTargetMuscleGroupId('spine')).toBeNull();
  });
});

// ── getFirstMuscleGroupId ───────────────────────────────────────────────

describe('getFirstMuscleGroupId', () => {
  it('returns the first mappable group, skipping unmappable entries', () => {
    expect(getFirstMuscleGroupId(['pectorals', 'biceps'])).toBe('chest');
    expect(getFirstMuscleGroupId(['cardiovascular system', 'biceps'])).toBe('biceps');
  });

  it('returns null when no group can be resolved', () => {
    expect(getFirstMuscleGroupId([])).toBeNull();
    expect(getFirstMuscleGroupId(['cardiovascular system', 'spine'])).toBeNull();
  });
});

// ── computeDominantMuscleGroup ──────────────────────────────────────────

describe('computeDominantMuscleGroup', () => {
  it('returns the most frequent group, skipping unmappable muscles', () => {
    expect(computeDominantMuscleGroup(['pectorals'])).toBe('chest');
    // 2x chest vs 1x biceps → chest
    expect(computeDominantMuscleGroup(['pectorals', 'biceps', 'pectorals'])).toBe('chest');
    // spine unmappable, 2x biceps vs 1x chest → biceps
    expect(computeDominantMuscleGroup(['pectorals', 'spine', 'biceps', 'biceps'])).toBe('biceps');
  });

  it('on tie, first-occurring group wins (Map insertion order)', () => {
    expect(computeDominantMuscleGroup(['pectorals', 'biceps'])).toBe('chest');
    expect(computeDominantMuscleGroup(['biceps', 'pectorals'])).toBe('biceps');
  });

  it('consolidates different muscles mapping to the same group', () => {
    // lats + upper back both → 'back' (2x) vs pectorals → 'chest' (1x)
    expect(computeDominantMuscleGroup(['pectorals', 'lats', 'upper back'])).toBe('back');
  });

  it('returns null when no group can be resolved', () => {
    expect(computeDominantMuscleGroup([])).toBeNull();
    expect(computeDominantMuscleGroup(['cardiovascular system', 'spine'])).toBeNull();
  });
});
