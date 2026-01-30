/**
 * Workout Constants
 *
 * Default values and shared styles for workout screens and components.
 */

/** Default number of sets for a new exercise */
export const DEFAULT_TARGET_SETS = 3;

/** Default number of reps for a new exercise */
export const DEFAULT_TARGET_REPS = 10;

/** Style applied to exercise cards during drag-and-drop */
export const CARD_ACTIVE_STYLE = { transform: [{ scale: 1.02 }], opacity: 0.9 } as const;

/** Content padding for the exercise list in Day Details */
export const EXERCISE_LIST_CONTENT_PADDING = { paddingTop: 8, paddingBottom: 160 } as const;

/** Height of the Start Workout floating button */
export const START_BUTTON_HEIGHT = 56;
