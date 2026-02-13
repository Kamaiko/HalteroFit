/**
 * Error Handling System - Unit tests
 *
 * Tests the custom error hierarchy and isOperationalError type guard.
 */

import {
  AppError,
  DatabaseError,
  AuthError,
  ValidationError,
  SyncError,
  isOperationalError,
} from '@/utils/errors';

// ── AppError ────────────────────────────────────────────────────────────

describe('AppError', () => {
  it('stores userMessage and developerMessage separately', () => {
    const err = new AppError('User-facing message', 'Dev detail', 'CODE');

    expect(err.userMessage).toBe('User-facing message');
    expect(err.developerMessage).toBe('Dev detail');
  });

  it('sets Error.message to developerMessage for logging', () => {
    const err = new AppError('User msg', 'Dev msg', 'CODE');
    expect(err.message).toBe('Dev msg');
  });

  it('sets name to the constructor name', () => {
    const err = new AppError('msg', 'dev', 'CODE');
    expect(err.name).toBe('AppError');
  });

  it('defaults to statusCode 500 and isOperational true', () => {
    const err = new AppError('msg', 'dev', 'CODE');
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
  });

  it('allows overriding statusCode and isOperational', () => {
    const err = new AppError('msg', 'dev', 'CODE', 404, false);
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(false);
  });
});

// ── toJSON ───────────────────────────────────────────────────────────────

describe('AppError.toJSON', () => {
  it('serializes all fields including timestamp', () => {
    const err = new AppError('User msg', 'Dev msg', 'TEST_CODE', 400, true);
    const json = err.toJSON();

    expect(json.name).toBe('AppError');
    expect(json.userMessage).toBe('User msg');
    expect(json.developerMessage).toBe('Dev msg');
    expect(json.code).toBe('TEST_CODE');
    expect(json.statusCode).toBe(400);
    expect(json.isOperational).toBe(true);
    expect(json.stack).toBeDefined();
    expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ── Subclass defaults ───────────────────────────────────────────────────

describe('DatabaseError', () => {
  it('defaults to code DATABASE_ERROR and statusCode 500', () => {
    const err = new DatabaseError('Could not save', 'INSERT failed');
    expect(err.code).toBe('DATABASE_ERROR');
    expect(err.statusCode).toBe(500);
  });
});

describe('AuthError', () => {
  it('defaults to code AUTH_ERROR and statusCode 401', () => {
    const err = new AuthError('Please sign in', 'No session');
    expect(err.code).toBe('AUTH_ERROR');
    expect(err.statusCode).toBe(401);
  });
});

describe('ValidationError', () => {
  it('defaults to code VALIDATION_ERROR and statusCode 400', () => {
    const err = new ValidationError('Name too long', 'name.length > 100');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
  });
});

describe('SyncError', () => {
  it('defaults to code SYNC_ERROR, statusCode 503, and isRetryable true', () => {
    const err = new SyncError('Sync failed', 'Timeout');
    expect(err.code).toBe('SYNC_ERROR');
    expect(err.statusCode).toBe(503);
    expect(err.isRetryable).toBe(true);
  });

  it('allows setting isRetryable to false', () => {
    const err = new SyncError('Sync failed', 'Auth expired', false);
    expect(err.isRetryable).toBe(false);
  });
});

// ── isOperationalError ──────────────────────────────────────────────────

describe('isOperationalError', () => {
  it('returns true for an operational AppError', () => {
    expect(isOperationalError(new AppError('msg', 'dev', 'CODE'))).toBe(true);
  });

  it('returns true for operational subclasses', () => {
    expect(isOperationalError(new DatabaseError('msg', 'dev'))).toBe(true);
    expect(isOperationalError(new ValidationError('msg', 'dev'))).toBe(true);
    expect(isOperationalError(new SyncError('msg', 'dev'))).toBe(true);
  });

  it('returns false for non-operational AppError', () => {
    const err = new AppError('msg', 'dev', 'CODE', 500, false);
    expect(isOperationalError(err)).toBe(false);
  });

  it('returns false for a regular Error', () => {
    expect(isOperationalError(new Error('oops'))).toBe(false);
  });

  it('returns false for non-error values', () => {
    expect(isOperationalError(null)).toBe(false);
    expect(isOperationalError(undefined)).toBe(false);
    expect(isOperationalError('string error')).toBe(false);
    expect(isOperationalError(42)).toBe(false);
  });
});
