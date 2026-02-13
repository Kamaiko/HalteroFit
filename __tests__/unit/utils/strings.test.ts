/**
 * String utility functions - Unit tests
 *
 * Tests capitalizeWords and stripStepPrefix from src/utils/strings.ts
 */

import { capitalizeWords, stripStepPrefix } from '@/utils/strings';

// ── capitalizeWords ─────────────────────────────────────────────────────

describe('capitalizeWords', () => {
  it('capitalizes first letter of each word', () => {
    expect(capitalizeWords('hello world')).toBe('Hello World');
  });

  it('handles a single word', () => {
    expect(capitalizeWords('chest')).toBe('Chest');
  });

  it('leaves already capitalized words unchanged', () => {
    expect(capitalizeWords('Hello World')).toBe('Hello World');
  });

  it('handles an empty string', () => {
    expect(capitalizeWords('')).toBe('');
  });

  it('handles multiple words from exercise data', () => {
    expect(capitalizeWords('barbell bench press')).toBe('Barbell Bench Press');
  });

  it('preserves single-character words', () => {
    expect(capitalizeWords('a b c')).toBe('A B C');
  });
});

// ── stripStepPrefix ─────────────────────────────────────────────────────

describe('stripStepPrefix', () => {
  it('removes Step:N prefix with space', () => {
    expect(stripStepPrefix('Step:1 Lie flat on your back')).toBe('Lie flat on your back');
  });

  it('returns instruction unchanged when no prefix', () => {
    expect(stripStepPrefix('Hold the bar with both hands')).toBe('Hold the bar with both hands');
  });

  it('handles multi-digit step numbers', () => {
    expect(stripStepPrefix('Step:12 Lower the weight slowly')).toBe('Lower the weight slowly');
  });

  it('is case insensitive', () => {
    expect(stripStepPrefix('step:3 Push up explosively')).toBe('Push up explosively');
    expect(stripStepPrefix('STEP:1 Grip the bar')).toBe('Grip the bar');
  });

  it('handles prefix without trailing space', () => {
    expect(stripStepPrefix('Step:1Start here')).toBe('Start here');
  });

  it('returns empty string for empty input', () => {
    expect(stripStepPrefix('')).toBe('');
  });
});
