/**
 * Auth Validation Utilities
 *
 * Centralized validation for authentication forms and service layer.
 *
 * USAGE:
 * // In screens (check result for inline errors):
 * const error = getEmailError(email);
 * if (error) { setEmailError(error); return; }
 *
 * // In service layer (throws on failure):
 * validateEmail(email);
 */

import { ValidationError } from '@/utils/errors';

// ============================================================================
// Constants
// ============================================================================

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72; // bcrypt limit
export const MAX_EMAIL_LENGTH = 254; // RFC 5321

// Simple email regex — Supabase does real validation server-side
const EMAIL_REGEX = /.+@.+\..+/;

// ============================================================================
// Result-based validators (for screens that show inline errors)
// ============================================================================

/**
 * Check if email is valid.
 * Returns an error message string, or null if valid.
 */
export function getEmailError(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return 'Email is required';
  }
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return `Email cannot exceed ${MAX_EMAIL_LENGTH} characters`;
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Enter a valid email address';
  }
  return null;
}

/**
 * Check if password is valid.
 * Returns an error message string, or null if valid.
 */
export function getPasswordError(password: string): string | null {
  if (password.length === 0) {
    return 'Password is required';
  }
  if (password.trim().length === 0) {
    return 'Password cannot be only whitespace';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`;
  }
  return null;
}

/**
 * Check if password confirmation matches.
 * Returns an error message string, or null if valid.
 */
export function getPasswordConfirmError(password: string, confirm: string): string | null {
  if (confirm.length === 0) {
    return 'Please confirm your password';
  }
  if (password !== confirm) {
    return 'Passwords do not match';
  }
  return null;
}

// ============================================================================
// Throwing validators (for service layer)
// ============================================================================

/**
 * Validate email. Throws ValidationError on failure.
 */
export function validateEmail(email: string): void {
  const error = getEmailError(email);
  if (error) {
    throw new ValidationError(error, `Email validation failed: "${email}"`);
  }
}

/**
 * Validate password. Throws ValidationError on failure.
 */
export function validatePassword(password: string): void {
  const error = getPasswordError(password);
  if (error) {
    throw new ValidationError(error, `Password validation failed: length=${password.length}`);
  }
}
