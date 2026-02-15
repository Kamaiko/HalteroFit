/**
 * Muscle Mapping Utilities
 *
 * Two mapping systems:
 * 1. MUSCLE_MAPPING: ExerciseDB names → body-highlighter Slugs (for MuscleHighlighter)
 * 2. TARGET_MUSCLE_TO_GROUP_ID: ExerciseDB names → muscle group IDs (for MuscleGroupIcon)
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
const MUSCLE_MAPPING: Record<string, Slug | Slug[]> = {
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
  lats: 'lats',
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
  back: ['upper-back', 'lats'],
  rhomboids: 'upper-back',
  'latissimus dorsi': 'lats',
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
// Implied Secondary Slugs
// ============================================================================

/**
 * Compensates for known ExerciseDB data gaps.
 *
 * When a target muscle resolves to one of these slugs, the paired slugs
 * are auto-injected as secondary (intensity 2) if not already present.
 *
 * Only fires for TARGET muscles (intensity 1). Secondaries injected via
 * this table do NOT trigger further chained injection (snapshot iteration).
 *
 * - Upper Back ↔ Lats: 0% cross-reference in ExerciseDB
 * - Upper Back → Trapezius: traps rarely listed as secondary for upper-back exercises
 * - Trapezius → Neck: upper trapezius region mapped to separate SVG slug
 */
const IMPLIED_SECONDARY_SLUGS: Partial<Record<Slug, Slug[]>> = {
  'upper-back': ['lats', 'trapezius'],
  lats: ['upper-back'],
  trapezius: ['neck'],
};

// ============================================================================
// Target Muscle → Muscle Group ID Mapping
// ============================================================================

/**
 * Maps ExerciseDB target muscle names to the 14 muscle group IDs
 * used by MuscleGroupIcon / muscleGroupIconConfig.
 *
 * Covers 18 mappable ExerciseDB target muscles.
 * "spine" has no SVG representation and remains unmapped.
 */
const TARGET_MUSCLE_TO_GROUP_ID: Record<string, string> = {
  pectorals: 'chest',
  lats: 'lats',
  'upper back': 'upper-back',
  delts: 'shoulder',
  traps: 'traps',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  abs: 'abs',
  quads: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  adductors: 'quads',
  abductors: 'glutes',
  calves: 'calves',
  'serratus anterior': 'abs',
  'levator scapulae': 'traps',
  'cardiovascular system': 'cardio',
};

/**
 * Convert an ExerciseDB target muscle name to a muscle group ID
 * for MuscleGroupIcon rendering.
 *
 * Returns null for unmappable targets (spine).
 */
export function getTargetMuscleGroupId(targetMuscle: string): string | null {
  return TARGET_MUSCLE_TO_GROUP_ID[targetMuscle.toLowerCase().trim()] ?? null;
}

/**
 * Get the muscle group ID from the first mappable target muscle in an array.
 * Used for exercise placeholder icons (single exercise → single icon).
 *
 * Returns null if no target muscle maps to a group ID.
 */
export function getFirstMuscleGroupId(targetMuscles: string[]): string | null {
  for (const muscle of targetMuscles) {
    const groupId = getTargetMuscleGroupId(muscle);
    if (groupId) return groupId;
  }
  return null;
}

// ============================================================================
// Body Highlighter Data
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
    const mapped = MUSCLE_MAPPING[muscle.toLowerCase().trim()];
    if (!mapped) {
      if (__DEV__) {
        console.warn(`[MuscleHighlighter] Unmapped target muscle: "${muscle}"`);
      }
      continue;
    }
    const slugs = Array.isArray(mapped) ? mapped : [mapped];
    for (const slug of slugs) {
      if (!slugSet.has(slug)) {
        slugSet.add(slug);
        result.push({ slug, intensity: 1 });
      }
    }
  }

  // Auto-inject implied secondary slugs for known data gaps
  for (const { slug } of [...result]) {
    const implied = IMPLIED_SECONDARY_SLUGS[slug];
    if (implied) {
      for (const impliedSlug of implied) {
        if (!slugSet.has(impliedSlug)) {
          slugSet.add(impliedSlug);
          result.push({ slug: impliedSlug, intensity: 2 });
        }
      }
    }
  }

  // Map secondary muscles (intensity 2 = lighter color, skip if already target)
  for (const muscle of secondaryMuscles) {
    const mapped = MUSCLE_MAPPING[muscle.toLowerCase().trim()];
    if (!mapped) {
      if (__DEV__) {
        console.warn(`[MuscleHighlighter] Unmapped secondary muscle: "${muscle}"`);
      }
      continue;
    }
    const slugs = Array.isArray(mapped) ? mapped : [mapped];
    for (const slug of slugs) {
      if (!slugSet.has(slug)) {
        slugSet.add(slug);
        result.push({ slug, intensity: 2 });
      }
    }
  }

  return {
    data: result,
    hasAnyMuscle: result.length > 0,
  };
}
