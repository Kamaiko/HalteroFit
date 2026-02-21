/**
 * Workout hooks barrel export
 *
 * Sub-hooks (useDayMenu, useAddDayDialog, useExerciseActions) are internal
 * to useWorkoutScreen and intentionally excluded from this barrel.
 * Import them via direct paths only when needed (e.g. tests).
 */

export { useWorkoutScreen, type UseWorkoutScreenReturn } from './useWorkoutScreen';
export { useEditDay, type UseEditDayReturn } from './useEditDay';
