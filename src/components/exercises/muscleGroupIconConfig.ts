/**
 * Muscle Group Icon Configuration
 *
 * Maps each muscle group ID to an SVG crop region and highlighted body part slugs.
 * Reuses the vendored body-highlighter SVG path data.
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
  /** Optional SVG path overlaid in primary color (e.g. heart for cardio) */
  overlayPath?: string;
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
  chest: {
    side: 'front',
    viewBox: '234 240 260 200',
    highlightSlugs: ['chest'],
  },
  lats: {
    side: 'back',
    viewBox: '811 314 267 313',
    highlightSlugs: ['lats'],
  },
  'upper-back': {
    side: 'back',
    viewBox: '952 281 258 239',
    highlightSlugs: ['upper-back'],
  },
  shoulder: {
    side: 'front',
    viewBox: '127 234 180 246',
    highlightSlugs: ['deltoids'],
  },
  traps: {
    side: 'back',
    viewBox: '940 220 254 259',
    highlightSlugs: ['trapezius', 'neck'],
  },
  biceps: {
    side: 'front',
    viewBox: '107 318 180 248',
    highlightSlugs: ['biceps'],
  },
  triceps: {
    side: 'back',
    viewBox: '842 334 180 248',
    highlightSlugs: ['triceps'],
  },
  forearms: {
    side: 'front',
    viewBox: '60 448 200 290',
    highlightSlugs: ['forearm'],
  },
  abs: {
    side: 'front',
    viewBox: '217 310 292 195',
    highlightSlugs: ['abs', 'obliques'],
  },
  quads: {
    side: 'front',
    viewBox: '210 650 310 310',
    highlightSlugs: ['quadriceps'],
  },
  hamstrings: {
    side: 'back',
    viewBox: '905 710 246 262',
    highlightSlugs: ['hamstring'],
  },
  glutes: {
    side: 'back',
    viewBox: '938 575 290 290',
    highlightSlugs: ['gluteal'],
  },
  calves: {
    side: 'back',
    viewBox: '929 878 310 290',
    highlightSlugs: ['calves'],
  },
  cardio: {
    side: 'front',
    viewBox: '234 240 260 210',
    highlightSlugs: [],
  },
  'show-all': {
    side: 'front',
    viewBox: '56 80 480 1320',
    highlightSlugs: [
      'chest',
      'obliques',
      'abs',
      'biceps',
      'neck',
      'trapezius',
      'deltoids',
      'adductors',
      'quadriceps',
      'knees',
      'tibialis',
      'calves',
      'forearm',
      'hands',
      'ankles',
      'feet',
      'head',
      'hair',
    ],
  },
};

// ============================================================================
// Overlay Paths
// ============================================================================

/**
 * Heart SVG path pre-transformed to chest viewBox coordinates (234 240 260 200).
 * Source: Material Design heart icon (24×24) scaled 5.5× and centered at (364, 360).
 */
const HEART_OVERLAY_PATH =
  'M364 448L356 441C328 416 309 398 309 378C309 361 322 348 339 348C349 348 358 352 364 359C370 352 379 348 389 348C406 348 419 361 419 378C419 398 400 416 372 441L364 448Z';

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

// Inject overlay paths for special icons
precomputedData.get('cardio')!.overlayPath = HEART_OVERLAY_PATH;

// ============================================================================
// Public API
// ============================================================================

/**
 * Get pre-computed render data for a muscle group icon.
 * Returns null for unknown muscle group IDs.
 */
export function getMuscleIconData(muscleGroupId: string): MuscleIconRenderData | null {
  return precomputedData.get(muscleGroupId) ?? null;
}
