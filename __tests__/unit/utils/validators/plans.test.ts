/**
 * Plan Validation Utilities - Unit tests
 *
 * Tests result-based validators (for UI alerts) and throwing validators (for DB operations).
 */

import { getDayCountError, validatePlanName, validateDayName } from '@/utils/validators/plans';
import { ValidationError } from '@/utils/errors';
import { MAX_DAYS_PER_PLAN, MAX_PLAN_NAME_LENGTH, MAX_DAY_NAME_LENGTH } from '@/constants';

// ── getDayCountError ────────────────────────────────────────────────────

describe('getDayCountError', () => {
  it('returns null when count is below the limit', () => {
    expect(getDayCountError(0)).toBeNull();
    expect(getDayCountError(MAX_DAYS_PER_PLAN - 1)).toBeNull();
  });

  it('returns error object when count equals the limit', () => {
    const result = getDayCountError(MAX_DAYS_PER_PLAN);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Day Limit Reached');
    expect(result!.description).toContain(String(MAX_DAYS_PER_PLAN));
  });

  it('returns error object when count exceeds the limit', () => {
    expect(getDayCountError(MAX_DAYS_PER_PLAN + 5)).not.toBeNull();
  });
});

// ── validatePlanName ────────────────────────────────────────────────────

describe('validatePlanName', () => {
  it('accepts a valid name', () => {
    expect(() => validatePlanName('Push Pull Legs', 'plan-1')).not.toThrow();
  });

  it('accepts a name at max length', () => {
    const name = 'a'.repeat(MAX_PLAN_NAME_LENGTH);
    expect(() => validatePlanName(name, 'plan-1')).not.toThrow();
  });

  it('throws ValidationError for empty string', () => {
    expect(() => validatePlanName('', 'plan-1')).toThrow(ValidationError);
  });

  it('throws ValidationError for whitespace-only string', () => {
    expect(() => validatePlanName('   ', 'plan-1')).toThrow(ValidationError);
  });

  it('throws ValidationError when name exceeds max length', () => {
    const name = 'a'.repeat(MAX_PLAN_NAME_LENGTH + 1);
    expect(() => validatePlanName(name, 'plan-1')).toThrow(ValidationError);
  });

  it('trims whitespace before checking length', () => {
    const paddedName = '  valid name  ';
    expect(() => validatePlanName(paddedName, 'plan-1')).not.toThrow();
  });

  it('includes context in the error detail', () => {
    try {
      validatePlanName('', 'plan-42');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).developerMessage).toContain('plan-42');
    }
  });
});

// ── validateDayName ─────────────────────────────────────────────────────

describe('validateDayName', () => {
  it('accepts a valid name', () => {
    expect(() => validateDayName('Chest Day', 'day-1')).not.toThrow();
  });

  it('accepts a name at max length', () => {
    const name = 'a'.repeat(MAX_DAY_NAME_LENGTH);
    expect(() => validateDayName(name, 'day-1')).not.toThrow();
  });

  it('throws ValidationError for empty string', () => {
    expect(() => validateDayName('', 'day-1')).toThrow(ValidationError);
  });

  it('throws ValidationError for whitespace-only string', () => {
    expect(() => validateDayName('   ', 'day-1')).toThrow(ValidationError);
  });

  it('throws ValidationError when name exceeds max length', () => {
    const name = 'a'.repeat(MAX_DAY_NAME_LENGTH + 1);
    expect(() => validateDayName(name, 'day-1')).toThrow(ValidationError);
  });

  it('uses the correct max length (different from plan name)', () => {
    expect(MAX_DAY_NAME_LENGTH).not.toBe(MAX_PLAN_NAME_LENGTH);

    const atDayLimit = 'a'.repeat(MAX_DAY_NAME_LENGTH);
    expect(() => validateDayName(atDayLimit, 'day-1')).not.toThrow();

    const overDayLimit = 'a'.repeat(MAX_DAY_NAME_LENGTH + 1);
    expect(() => validateDayName(overDayLimit, 'day-1')).toThrow(ValidationError);
  });
});
