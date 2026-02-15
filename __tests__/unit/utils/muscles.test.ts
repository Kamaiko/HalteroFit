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
    // 17 inputs but 16 unique slugs (glutes/abductors both → gluteal)
    expect(result.data.length).toBe(16);
    expect(result.data.every((d) => d.intensity === 1)).toBe(true);
    expect(result.hasAnyMuscle).toBe(true);
  });

  it('maps lats and upper back to separate slugs (with trapezius implied)', () => {
    const result = getMuscleHighlighterData(['lats', 'upper back'], []);
    expect(result.data).toEqual([
      { slug: 'lats', intensity: 1 },
      { slug: 'upper-back', intensity: 1 },
      { slug: 'trapezius', intensity: 2 },
    ]);
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

  // ── Multi-slug mapping ─────────────────────────────────────────────

  it('maps generic "back" secondary to both upper-back and lats', () => {
    const result = getMuscleHighlighterData([], ['back']);
    expect(result.data).toEqual([
      { slug: 'upper-back', intensity: 2 },
      { slug: 'lats', intensity: 2 },
    ]);
  });

  it('deduplicates multi-slug "back" with explicit "latissimus dorsi"', () => {
    const result = getMuscleHighlighterData([], ['back', 'latissimus dorsi']);
    const latsEntries = result.data.filter((d) => d.slug === 'lats');
    expect(latsEntries).toHaveLength(1);
  });

  // ── Implied secondary slugs ────────────────────────────────────────

  it('auto-injects lats and trapezius as secondary when upper-back is target', () => {
    const result = getMuscleHighlighterData(['upper back'], []);
    expect(result.data).toEqual([
      { slug: 'upper-back', intensity: 1 },
      { slug: 'lats', intensity: 2 },
      { slug: 'trapezius', intensity: 2 },
    ]);
  });

  it('auto-injects upper-back as secondary when lats is target', () => {
    const result = getMuscleHighlighterData(['lats'], []);
    expect(result.data).toEqual([
      { slug: 'lats', intensity: 1 },
      { slug: 'upper-back', intensity: 2 },
    ]);
  });

  it('does not duplicate when implied slug already in secondaries', () => {
    const result = getMuscleHighlighterData(['upper back'], ['latissimus dorsi']);
    const latsEntries = result.data.filter((d) => d.slug === 'lats');
    expect(latsEntries).toHaveLength(1);
    expect(latsEntries[0]!.intensity).toBe(2);
  });

  it('skips already-present slugs but injects remaining implied', () => {
    const result = getMuscleHighlighterData(['upper back', 'lats'], []);
    expect(result.data).toEqual([
      { slug: 'upper-back', intensity: 1 },
      { slug: 'lats', intensity: 1 },
      { slug: 'trapezius', intensity: 2 },
    ]);
  });

  it('auto-injects neck as secondary when trapezius is target', () => {
    const result = getMuscleHighlighterData(['traps'], []);
    expect(result.data).toEqual([
      { slug: 'trapezius', intensity: 1 },
      { slug: 'neck', intensity: 2 },
    ]);
  });

  it('does not chain-inject neck when trapezius is only implied secondary', () => {
    // upper-back → injects [lats, trapezius], but trapezius is not in snapshot
    // so trapezius → neck does NOT fire
    const result = getMuscleHighlighterData(['upper back'], []);
    const neckEntries = result.data.filter((d) => d.slug === 'neck');
    expect(neckEntries).toHaveLength(0);
  });

  it('does not duplicate neck when already in secondaries for trapezius target', () => {
    const result = getMuscleHighlighterData(['traps'], ['sternocleidomastoid']);
    const neckEntries = result.data.filter((d) => d.slug === 'neck');
    expect(neckEntries).toHaveLength(1);
    expect(neckEntries[0]!.intensity).toBe(2);
  });

  it('does not inject neck when trapezius is only a secondary muscle', () => {
    const result = getMuscleHighlighterData(['pectorals'], ['trapezius']);
    const neckEntries = result.data.filter((d) => d.slug === 'neck');
    expect(neckEntries).toHaveLength(0);
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
  it('maps all 14 muscle group IDs from ExerciseDB target muscles', () => {
    expect(getTargetMuscleGroupId('pectorals')).toBe('chest');
    expect(getTargetMuscleGroupId('lats')).toBe('lats');
    expect(getTargetMuscleGroupId('upper back')).toBe('upper-back');
    expect(getTargetMuscleGroupId('delts')).toBe('shoulder');
    expect(getTargetMuscleGroupId('traps')).toBe('traps');
    expect(getTargetMuscleGroupId('biceps')).toBe('biceps');
    expect(getTargetMuscleGroupId('triceps')).toBe('triceps');
    expect(getTargetMuscleGroupId('forearms')).toBe('forearms');
    expect(getTargetMuscleGroupId('abs')).toBe('abs');
    expect(getTargetMuscleGroupId('quads')).toBe('quads');
    expect(getTargetMuscleGroupId('hamstrings')).toBe('hamstrings');
    expect(getTargetMuscleGroupId('glutes')).toBe('glutes');
    expect(getTargetMuscleGroupId('calves')).toBe('calves');
    expect(getTargetMuscleGroupId('cardiovascular system')).toBe('cardio');
  });

  it('maps secondary ExerciseDB targets to correct groups', () => {
    expect(getTargetMuscleGroupId('adductors')).toBe('quads');
    expect(getTargetMuscleGroupId('abductors')).toBe('glutes');
    expect(getTargetMuscleGroupId('serratus anterior')).toBe('abs');
    expect(getTargetMuscleGroupId('levator scapulae')).toBe('traps');
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(getTargetMuscleGroupId(' DELTS ')).toBe('shoulder');
  });

  it('returns null for unmappable muscles', () => {
    expect(getTargetMuscleGroupId('spine')).toBeNull();
  });
});

// ── getFirstMuscleGroupId ───────────────────────────────────────────────

describe('getFirstMuscleGroupId', () => {
  it('returns the first mappable group, skipping unmappable entries', () => {
    expect(getFirstMuscleGroupId(['pectorals', 'biceps'])).toBe('chest');
    expect(getFirstMuscleGroupId(['spine', 'biceps'])).toBe('biceps');
  });

  it('returns cardio for cardiovascular system exercises', () => {
    expect(getFirstMuscleGroupId(['cardiovascular system'])).toBe('cardio');
    expect(getFirstMuscleGroupId(['cardiovascular system', 'biceps'])).toBe('cardio');
  });

  it('returns null when no group can be resolved', () => {
    expect(getFirstMuscleGroupId([])).toBeNull();
    expect(getFirstMuscleGroupId(['spine'])).toBeNull();
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

  it('treats lats and upper-back as separate groups (not merged)', () => {
    // Each maps to its own group (1x each) — first-occurring wins
    expect(computeDominantMuscleGroup(['lats', 'upper back', 'pectorals'])).toBe('lats');
    expect(computeDominantMuscleGroup(['upper back', 'lats', 'pectorals'])).toBe('upper-back');
    expect(computeDominantMuscleGroup(['pectorals', 'lats', 'upper back'])).toBe('chest');
  });

  it('returns cardio for cardiovascular-dominant days', () => {
    expect(computeDominantMuscleGroup(['cardiovascular system'])).toBe('cardio');
    // 2x cardio vs 1x chest → cardio
    expect(
      computeDominantMuscleGroup(['cardiovascular system', 'pectorals', 'cardiovascular system'])
    ).toBe('cardio');
  });

  it('returns null when no group can be resolved', () => {
    expect(computeDominantMuscleGroup([])).toBeNull();
    expect(computeDominantMuscleGroup(['spine'])).toBeNull();
  });
});
