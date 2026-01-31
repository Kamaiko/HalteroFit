/**
 * Workout Constants
 *
 * Default values and shared styles for workout screens and components.
 */

/** Default number of sets for a new exercise */
export const DEFAULT_TARGET_SETS = 3;

/** Default number of reps for a new exercise */
export const DEFAULT_TARGET_REPS = 10;

// ============================================================================
// Validation Limits
// ============================================================================

/** Maximum number of exercises allowed per workout day */
export const MAX_EXERCISES_PER_DAY = 30;

/** Maximum number of days allowed per workout plan */
export const MAX_DAYS_PER_PLAN = 14;

/** Maximum length for workout day names */
export const MAX_DAY_NAME_LENGTH = 50;

/** Maximum length for workout plan names */
export const MAX_PLAN_NAME_LENGTH = 100;

/** Maximum length for exercise notes (Phase 3+) */
export const MAX_EXERCISE_NOTES_LENGTH = 500;

/** Style applied to exercise cards during drag-and-drop */
export const CARD_ACTIVE_STYLE = { transform: [{ scale: 1.02 }], opacity: 0.9 } as const;

/** Content padding for the day list in Overview (less overshoot) */
export const OVERVIEW_LIST_CONTENT_PADDING = { paddingTop: 8, paddingBottom: 100 } as const;

/** Content padding for the exercise list in Day Details (more room to clear floating button) */
export const EXERCISE_LIST_CONTENT_PADDING = { paddingTop: 8, paddingBottom: 160 } as const;

/** Height of the Start Workout floating button */
export const START_BUTTON_HEIGHT = 56;
