/**
 * Muscle mapping utilities - Unit tests
 *
 * Tests getMuscleHighlighterData deduplication, precedence, implied secondary
 * injection rules, and computeDominantMuscleGroup tie-breaking.
 *
 * Lookup table coverage (basic mapping, unmapped, case/whitespace) and
 * getTargetMuscleGroupId / getFirstMuscleGroupId are trivial map lookups — not tested.
 */

import { getMuscleHighlighterData } from '@/utils/muscles';
import { computeDominantMuscleGroup } from '@/services/database/operations/plans/mappers';

// ── Deduplication & precedence ──────────────────────────────────────────

describe('getMuscleHighlighterData', () => {
  it('gives target precedence when muscle appears in both arrays', () => {
    const result = getMuscleHighlighterData(['biceps'], ['biceps']);
    expect(result.data).toEqual([{ slug: 'biceps', intensity: 1 }]);
  });

  it('deduplicates when multiple names map to same slug', () => {
    const result = getMuscleHighlighterData([], ['traps', 'trapezius']);
    const trapEntries = result.data.filter((d) => d.slug === 'trapezius');
    expect(trapEntries).toHaveLength(1);
  });

  // ── Regression guard: all ExerciseDB targets mappable ─────────────────

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

  // ── Implied secondary slugs ──────────────────────────────────────────

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

  // ── Trapezius → neck rules ───────────────────────────────────────────

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

  it('does not inject neck when trapezius is only a secondary muscle', () => {
    const result = getMuscleHighlighterData(['pectorals'], ['trapezius']);
    const neckEntries = result.data.filter((d) => d.slug === 'neck');
    expect(neckEntries).toHaveLength(0);
  });
});

// ── computeDominantMuscleGroup ──────────────────────────────────────────

describe('computeDominantMuscleGroup', () => {
  it('on tie, first-occurring group wins (Map insertion order)', () => {
    expect(computeDominantMuscleGroup(['pectorals', 'biceps'])).toBe('chest');
    expect(computeDominantMuscleGroup(['biceps', 'pectorals'])).toBe('biceps');
  });
});
