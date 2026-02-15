/**
 * Muscle Group Icon Configuration
 *
 * Maps each muscle group ID to an SVG crop region and highlighted body part slugs.
 * Reuses the vendored body-highlighter SVG path data without modifying the library.
 */

import type { BodyPart, Slug } from '@/lib/body-highlighter';
import { bodyBack } from '@/lib/body-highlighter/assets/bodyBack';
import { bodyFront } from '@/lib/body-highlighter/assets/bodyFront';

// ============================================================================
// Types
// ============================================================================

interface MuscleIconConfig {
  /** Which body view to render */
  side: 'front' | 'back';
  /** SVG viewBox for cropping: "minX minY width height" */
  viewBox: string;
  /** Body part slug(s) to highlight in primary color */
  highlightSlugs: Slug[];
}

export interface MuscleIconRenderData {
  viewBox: string;
  /** All SVG path strings for the dim body layer */
  allPaths: string[];
  /** SVG path strings for the highlighted muscle(s) */
  highlightPaths: string[];
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * ViewBox coordinates derived from SVG path data ranges.
 * Front view coordinate space: 0-724 x, 0-1448 y
 * Back view coordinate space: 724-1448 x, 0-1448 y
 */
const MUSCLE_ICON_CONFIGS: Record<string, MuscleIconConfig> = {
  triceps: {
    side: 'back',
    viewBox: '1130 320 230 330',
    highlightSlugs: ['triceps'],
  },
  chest: {
    side: 'front',
    viewBox: '230 290 270 210',
    highlightSlugs: ['chest'],
  },
  shoulder: {
    side: 'front',
    viewBox: '160 240 410 220',
    highlightSlugs: ['deltoids'],
  },
  biceps: {
    side: 'front',
    viewBox: '100 290 230 310',
    highlightSlugs: ['biceps'],
  },
  abs: {
    side: 'front',
    viewBox: '290 390 150 310',
    highlightSlugs: ['abs'],
  },
  back: {
    side: 'back',
    viewBox: '960 280 250 310',
    highlightSlugs: ['upper-back', 'trapezius'],
  },
  forearms: {
    side: 'front',
    viewBox: '50 420 260 380',
    highlightSlugs: ['forearm'],
  },
  'upper-leg': {
    side: 'front',
    viewBox: '210 650 310 310',
    highlightSlugs: ['quadriceps', 'adductors'],
  },
  glutes: {
    side: 'back',
    viewBox: '940 560 290 260',
    highlightSlugs: ['gluteal'],
  },
  'lower-leg': {
    side: 'front',
    viewBox: '220 940 290 310',
    highlightSlugs: ['calves', 'tibialis'],
  },
};

// ============================================================================
// Path Extraction
// ============================================================================

/** Extract all SVG path strings from a body part data array */
function getAllPaths(bodyParts: BodyPart[]): string[] {
  return bodyParts.flatMap((part) => [
    ...(part.path?.left ?? []),
    ...(part.path?.right ?? []),
    ...(part.path?.common ?? []),
  ]);
}

/** Extract SVG path strings for specific slug(s) */
function getPathsForSlugs(bodyParts: BodyPart[], slugs: Slug[]): string[] {
  const slugSet = new Set<string>(slugs);
  return bodyParts
    .filter((part) => part.slug !== undefined && slugSet.has(part.slug))
    .flatMap((part) => [
      ...(part.path?.left ?? []),
      ...(part.path?.right ?? []),
      ...(part.path?.common ?? []),
    ]);
}

// ============================================================================
// Pre-computed Data (computed once at module load)
// ============================================================================

const ALL_FRONT_PATHS = getAllPaths(bodyFront);
const ALL_BACK_PATHS = getAllPaths(bodyBack);

const precomputedData = new Map<string, MuscleIconRenderData>();

for (const [id, config] of Object.entries(MUSCLE_ICON_CONFIGS)) {
  const bodyData = config.side === 'front' ? bodyFront : bodyBack;
  const allPaths = config.side === 'front' ? ALL_FRONT_PATHS : ALL_BACK_PATHS;

  precomputedData.set(id, {
    viewBox: config.viewBox,
    allPaths,
    highlightPaths: getPathsForSlugs(bodyData, config.highlightSlugs),
  });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get pre-computed render data for a muscle group icon.
 * Returns null for muscle groups without SVG representation (cardio, show-all).
 */
export function getMuscleIconData(muscleGroupId: string): MuscleIconRenderData | null {
  return precomputedData.get(muscleGroupId) ?? null;
}
