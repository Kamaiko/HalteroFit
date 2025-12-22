import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@nozbe/watermelondb)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test-helpers/(.*)$': '<rootDir>/__tests__/__helpers__/$1', // Test helpers (factories, queries, time, assertions)
    '^@tests/(.*)$': '<rootDir>/__tests__/$1', // General tests infrastructure (fixtures, e2e)
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/?(*.)+(spec|test).{ts,tsx}'],

  // Exclude integration tests from default test run (use npm run test:integration)
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/integration/', // Integration tests have separate config
  ],

  // Coverage thresholds (see TESTING.md for strategy)
  coverageThreshold: {
    global: {
      // Global thresholds disabled for Phase 0.5 (only testing database layer)
      // Will be enabled in Phase 1 when testing broader codebase
      // branches: 0,
      // functions: 0,
      // lines: 0,
      // statements: 0,
    },
    './src/services/database/': {
      branches: 0, // 0% actual coverage (no branch testing yet)
      functions: 1,
      lines: 1,
      statements: 1,
    },
  },

  // Performance optimizations
  cacheDirectory: '.jest-cache',
  maxWorkers: '50%', // Use 50% of CPU cores for parallel test execution

  // Verbose output in CI for better debugging
  verbose: process.env.CI === 'true',

  // Force exit after tests complete
  // Required for WatermelonDB/LokiJS which keeps worker threads open
  // See: docs/TESTING.md#known-issues for details
  forceExit: true,
};

export default config;
