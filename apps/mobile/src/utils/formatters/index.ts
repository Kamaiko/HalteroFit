/**
 * Formatters - Main Export
 *
 * Data formatting utilities (weight, date, duration, etc.)
 *
 * USAGE:
 * import { formatWorkoutDate, formatDuration } from '@/utils/formatters';
 */

/**
 * Format timestamp to readable date string
 * @example formatWorkoutDate(1706572800000) // "Jan 30, 2024"
 */
export function formatWorkoutDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format duration from seconds to readable string
 * @example formatDuration(4980) // "1h 23m"
 * @example formatDuration(2700) // "45m"
 * @example formatDuration(undefined) // "Not completed"
 */
export function formatDuration(seconds?: number): string {
  if (seconds == null) return 'Not completed';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
