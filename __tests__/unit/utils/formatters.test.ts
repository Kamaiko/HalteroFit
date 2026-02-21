/**
 * Formatters - Unit tests
 *
 * Tests date and duration formatting utilities.
 */

import { formatWorkoutDate, formatDuration } from '@/utils/formatters';

// ── formatWorkoutDate ──────────────────────────────────────────────────

describe('formatWorkoutDate', () => {
  it('formats a timestamp to "Mon DD, YYYY" format', () => {
    // Use noon local time to avoid timezone boundary shifts
    const timestamp = new Date(2024, 0, 30, 12, 0, 0).getTime();
    const result = formatWorkoutDate(timestamp);
    expect(result).toBe('Jan 30, 2024');
  });

  it('formats a different date correctly', () => {
    const timestamp = new Date(2023, 11, 25, 12, 0, 0).getTime();
    const result = formatWorkoutDate(timestamp);
    expect(result).toBe('Dec 25, 2023');
  });
});

// ── formatDuration ─────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('returns "Not completed" for undefined', () => {
    expect(formatDuration(undefined)).toBe('Not completed');
  });

  it('returns "Not completed" for null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(formatDuration(null as any)).toBe('Not completed');
  });

  it('returns "0m" for 0 seconds', () => {
    expect(formatDuration(0)).toBe('0m');
  });

  it('formats minutes only when under 1 hour', () => {
    expect(formatDuration(2700)).toBe('45m');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(4980)).toBe('1h 23m');
  });

  it('formats exact hours with 0 minutes', () => {
    expect(formatDuration(3600)).toBe('1h 0m');
  });

  it('formats multiple hours', () => {
    expect(formatDuration(7200)).toBe('2h 0m');
  });
});
