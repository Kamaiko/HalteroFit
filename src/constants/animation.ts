/**
 * Animation Constants
 *
 * Shared animation durations, delays, and timing values.
 * Use these instead of hardcoded numbers in component animations.
 *
 * USAGE:
 * import { DURATION_STANDARD, SCROLL_THROTTLE_60FPS } from '@/constants';
 */

// ============================================================================
// Durations (milliseconds)
// ============================================================================

/** Instant interactions: long-press triggers, micro-feedback (100ms) */
export const DURATION_INSTANT = 100;

/** Fast transitions: sequential animation delays, quick slides (150ms) */
export const DURATION_FAST = 150;

/** Standard transitions: card animations, tab indicators, image swaps (200ms) */
export const DURATION_STANDARD = 200;

/** Moderate transitions: fade-ins, chart animations, image loading (300ms) */
export const DURATION_MODERATE = 300;

// ============================================================================
// Scroll
// ============================================================================

/** Scroll event throttle for 60 FPS (use with scrollEventThrottle prop) */
export const SCROLL_THROTTLE_60FPS = 16;
