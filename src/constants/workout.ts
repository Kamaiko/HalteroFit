/**
 * Workout Constants
 *
 * Default values and shared styles for workout screens and components.
 */

/** Default number of sets for a new exercise */
export const DEFAULT_TARGET_SETS = 3;

/** Default number of reps for a new exercise */
export const DEFAULT_TARGET_REPS = 10;

/** Average minutes per exercise for time estimation (includes sets, rest, transitions) */
export const MINUTES_PER_EXERCISE = 5;

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

/** Height of the Start Workout floating button */
export const START_BUTTON_HEIGHT = 56;

// ============================================================================
// Default Names
// ============================================================================

/** Default name for a new workout plan */
export const DEFAULT_PLAN_NAME = 'New Workout';

/** Default name for the first day in a new plan */
export const DEFAULT_FIRST_DAY_NAME = 'Workout Day #1';

/** Default day-of-week for the first day in a new plan */
export const DEFAULT_FIRST_DAY_OF_WEEK = 'MON';

/** Default name when adding a day without entering a name */
export const DEFAULT_DAY_NAME = 'New day';
