/**
 * Plan Validation Utilities - Unit tests
 *
 * Tests result-based validators (for UI alerts) and throwing validators (for DB operations).
 * Boundary testing: at-limit and over-limit cases only — happy paths implied.
 */

import { getDayCountError, validatePlanName, validateDayName } from '@/utils/validators/plans';
import { ValidationError } from '@/utils/errors';
import { MAX_DAYS_PER_PLAN, MAX_PLAN_NAME_LENGTH, MAX_DAY_NAME_LENGTH } from '@/constants';

// ── getDayCountError ────────────────────────────────────────────────────

describe('getDayCountError', () => {
  it('returns error object when count equals the limit', () => {
    const result = getDayCountError(MAX_DAYS_PER_PLAN);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Day Limit Reached');
    expect(result!.description).toContain(String(MAX_DAYS_PER_PLAN));
  });
});

// ── validatePlanName ────────────────────────────────────────────────────

describe('validatePlanName', () => {
  it('accepts a name at max length', () => {
    const name = 'a'.repeat(MAX_PLAN_NAME_LENGTH);
    expect(() => validatePlanName(name, 'plan-1')).not.toThrow();
  });

  it('throws ValidationError for whitespace-only string', () => {
    expect(() => validatePlanName('   ', 'plan-1')).toThrow(ValidationError);
  });

  it('throws ValidationError when name exceeds max length', () => {
    const name = 'a'.repeat(MAX_PLAN_NAME_LENGTH + 1);
    expect(() => validatePlanName(name, 'plan-1')).toThrow(ValidationError);
  });
});

// ── validateDayName ─────────────────────────────────────────────────────

describe('validateDayName', () => {
  it('uses MAX_DAY_NAME_LENGTH, not MAX_PLAN_NAME_LENGTH', () => {
    const atDayLimit = 'a'.repeat(MAX_DAY_NAME_LENGTH);
    expect(() => validateDayName(atDayLimit, 'day-1')).not.toThrow();

    const overDayLimit = 'a'.repeat(MAX_DAY_NAME_LENGTH + 1);
    expect(() => validateDayName(overDayLimit, 'day-1')).toThrow(ValidationError);
  });
});
