/**
 * Muscle mapping constants - Unit tests
 *
 * Tests getMuscleHighlighterData from src/constants/muscles.ts
 */

import { getMuscleHighlighterData } from '@/constants/muscles';

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
