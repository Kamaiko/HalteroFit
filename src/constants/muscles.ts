/**
 * Muscle Mapping Constants
 *
 * Maps ExerciseDB muscle names to body-highlighter SVG slugs.
 * Used by MuscleHighlighter component to convert exercise data
 * into visual body diagram highlights.
 *
 * The body-highlighter renders both front and back views independently.
 * Slugs that exist on a given view are highlighted; others are ignored.
 * This means the same data array can be passed to both views.
 */

import type { Slug } from '@/lib/body-highlighter';

// ============================================================================
// Types
// ============================================================================

interface MuscleData {
  slug: Slug;
  intensity: number;
}

export interface MuscleHighlighterData {
  data: MuscleData[];
  hasAnyMuscle: boolean;
}

// ============================================================================
// Mapping Table
// ============================================================================

/**
 * Maps ExerciseDB muscle names (lowercase) to body-highlighter slugs.
 *
 * Coverage:
 * - 19 target muscles from ExerciseDB (17 mapped, 2 unmappable)
 * - 41 secondary muscles from ExerciseDB (41 mapped, 0 unmappable)
 *
 * Unmappable targets: "cardiovascular system", "spine" (not muscles).
 * Unmapped muscles are silently skipped with __DEV__ warnings.
 */
const MUSCLE_MAPPING: Record<string, Slug> = {
  // --- Direct matches ---
  abs: 'abs',
  ankles: 'ankles',
  biceps: 'biceps',
  calves: 'calves',
  feet: 'feet',
  hands: 'hands',
  obliques: 'obliques',
  triceps: 'triceps',

  // --- Target muscles (name differences) ---
  pectorals: 'chest',
  delts: 'deltoids',
  glutes: 'gluteal',
  quads: 'quadriceps',
  hamstrings: 'hamstring',
  forearms: 'forearm',
  traps: 'trapezius',
  lats: 'upper-back',
  adductors: 'adductors',
  abductors: 'gluteal', // hip abductors ≈ glute medius
  'upper back': 'upper-back',
  'serratus anterior': 'obliques', // lateral rib cage ≈ obliques visually
  'levator scapulae': 'neck', // neck/upper trap region

  // --- Secondary muscles (aliases) ---
  chest: 'chest',
  deltoids: 'deltoids',
  shoulders: 'deltoids',
  'rear deltoids': 'deltoids',
  'rotator cuff': 'deltoids', // deep shoulder ≈ deltoids visually
  quadriceps: 'quadriceps',
  'hip flexors': 'quadriceps', // psoas/iliaque ≈ quad region visually
  trapezius: 'trapezius',
  'lower back': 'lower-back',
  back: 'upper-back',
  rhomboids: 'upper-back',
  'latissimus dorsi': 'upper-back',
  'inner thighs': 'adductors',
  groin: 'adductors',
  shins: 'tibialis',
  abdominals: 'abs',
  'lower abs': 'abs',
  core: 'abs',
  'upper chest': 'chest',
  brachialis: 'biceps', // under biceps
  soleus: 'calves', // calf muscle
  sternocleidomastoid: 'neck',
  'ankle stabilizers': 'ankles',
  'wrist extensors': 'forearm',
  'wrist flexors': 'forearm',
  wrists: 'forearm',
  'grip muscles': 'forearm',
};

// ============================================================================
// Helper Function
// ============================================================================

/**
 * Converts ExerciseDB muscle arrays into body-highlighter data format.
 *
 * - Target muscles get intensity 1 (strong primary color)
 * - Secondary muscles get intensity 2 (lighter primary color)
 * - If a muscle appears in both arrays, target takes precedence
 * - Unmapped muscles are silently filtered (with __DEV__ warnings)
 *
 * @example
 * ```ts
 * const result = getMuscleHighlighterData(['pectorals'], ['triceps', 'deltoids']);
 * // result.data = [
 * //   { slug: 'chest', intensity: 1 },
 * //   { slug: 'triceps', intensity: 2 },
 * //   { slug: 'deltoids', intensity: 2 },
 * // ]
 * ```
 */
export function getMuscleHighlighterData(
  targetMuscles: string[],
  secondaryMuscles: string[]
): MuscleHighlighterData {
  const slugSet = new Set<Slug>();
  const result: MuscleData[] = [];

  // Map target muscles first (intensity 1 = primary color)
  for (const muscle of targetMuscles) {
    const slug = MUSCLE_MAPPING[muscle.toLowerCase().trim()];
    if (!slug) {
      if (__DEV__) {
        console.warn(`[MuscleHighlighter] Unmapped target muscle: "${muscle}"`);
      }
      continue;
    }
    if (!slugSet.has(slug)) {
      slugSet.add(slug);
      result.push({ slug, intensity: 1 });
    }
  }

  // Map secondary muscles (intensity 2 = lighter color, skip if already target)
  for (const muscle of secondaryMuscles) {
    const slug = MUSCLE_MAPPING[muscle.toLowerCase().trim()];
    if (!slug) {
      if (__DEV__) {
        console.warn(`[MuscleHighlighter] Unmapped secondary muscle: "${muscle}"`);
      }
      continue;
    }
    if (!slugSet.has(slug)) {
      slugSet.add(slug);
      result.push({ slug, intensity: 2 });
    }
  }

  return {
    data: result,
    hasAnyMuscle: result.length > 0,
  };
}
