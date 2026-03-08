/**
 * Auth Validation Utilities - Unit Tests
 *
 * Tests result-based validators (for inline form errors) and throwing validators
 * (for service layer). Boundary testing on length limits.
 */

import {
  getEmailError,
  getPasswordError,
  getPasswordConfirmError,
  validateEmail,
  validatePassword,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_EMAIL_LENGTH,
} from '@/utils/validators/auth';
import { ValidationError } from '@/utils/errors';

// ── getEmailError ───────────────────────────────────────────────────────

describe('getEmailError', () => {
  it('returns null for valid email', () => {
    expect(getEmailError('user@example.com')).toBeNull();
  });

  it('returns error for empty string', () => {
    expect(getEmailError('')).toBe('Email is required');
  });

  it('returns error for whitespace-only', () => {
    expect(getEmailError('   ')).toBe('Email is required');
  });

  it('returns error for missing @', () => {
    expect(getEmailError('userexample.com')).toBe('Enter a valid email address');
  });

  it('returns error for missing domain', () => {
    expect(getEmailError('user@')).toBe('Enter a valid email address');
  });

  it('returns error for missing TLD', () => {
    expect(getEmailError('user@example')).toBe('Enter a valid email address');
  });

  it('returns error when exceeding max length', () => {
    const longEmail = 'a'.repeat(MAX_EMAIL_LENGTH) + '@b.com';
    expect(getEmailError(longEmail)).toBe(`Email cannot exceed ${MAX_EMAIL_LENGTH} characters`);
  });
});

// ── getPasswordError ────────────────────────────────────────────────────

describe('getPasswordError', () => {
  it('returns null for valid password at min length', () => {
    expect(getPasswordError('a'.repeat(MIN_PASSWORD_LENGTH))).toBeNull();
  });

  it('returns null for valid password at max length', () => {
    expect(getPasswordError('a'.repeat(MAX_PASSWORD_LENGTH))).toBeNull();
  });

  it('returns error for empty string', () => {
    expect(getPasswordError('')).toBe('Password is required');
  });

  it('returns error for whitespace-only', () => {
    expect(getPasswordError('        ')).toBe('Password cannot be only whitespace');
  });

  it('returns error for too short', () => {
    expect(getPasswordError('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    );
  });

  it('returns error for too long', () => {
    expect(getPasswordError('a'.repeat(MAX_PASSWORD_LENGTH + 1))).toBe(
      `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`
    );
  });
});

// ── getPasswordConfirmError ─────────────────────────────────────────────

describe('getPasswordConfirmError', () => {
  it('returns null when passwords match', () => {
    expect(getPasswordConfirmError('password1', 'password1')).toBeNull();
  });

  it('returns error for empty confirmation', () => {
    expect(getPasswordConfirmError('password1', '')).toBe('Please confirm your password');
  });

  it('returns error when passwords do not match', () => {
    expect(getPasswordConfirmError('password1', 'password2')).toBe('Passwords do not match');
  });
});

// ── Throwing validators ─────────────────────────────────────────────────

describe('validateEmail', () => {
  it('does not throw for valid email', () => {
    expect(() => validateEmail('user@example.com')).not.toThrow();
  });

  it('throws ValidationError for invalid email', () => {
    expect(() => validateEmail('')).toThrow(ValidationError);
  });
});

describe('validatePassword', () => {
  it('does not throw for valid password', () => {
    expect(() => validatePassword('validpass')).not.toThrow();
  });

  it('throws ValidationError for invalid password', () => {
    expect(() => validatePassword('')).toThrow(ValidationError);
  });
});
