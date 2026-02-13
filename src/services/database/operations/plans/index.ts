/**
 * Workout Plans Operations - Barrel Export
 *
 * Dual API Architecture:
 * - Promise-based functions for imperative code (actions)
 * - Observable-based functions for reactive UI (hooks)
 *
 * All operations are LOCAL FIRST (instant), sync happens separately.
 */

export * from './types';
export { planToPlain, planDayToPlain, planDayExerciseToPlain } from './mappers';
export * from './plan-operations';
export * from './day-operations';
export * from './exercise-operations';
