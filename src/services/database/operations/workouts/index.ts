/**
 * Workout Operations - Barrel Export
 *
 * Dual API Architecture:
 * - Promise-based functions for imperative code (actions)
 * - Observable-based functions for reactive UI (hooks)
 *
 * All operations are LOCAL FIRST (instant), sync happens separately.
 */

export * from './queries';
export * from './mutations';
