import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '<rootDir>/__tests__/integration/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@nozbe/watermelondb|msw|@mswjs|until-async)',
  ],

  // Timeout for sync/network tests (msw integration)
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '__tests__/__helpers__/network/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test-helpers/(.*)$': '<rootDir>/__tests__/__helpers__/$1', // Test helpers (factories, queries, time, assertions)
    '^@tests/(.*)$': '<rootDir>/__tests__/$1', // General tests infrastructure (fixtures, e2e)
    // msw v2 uses conditional exports - point Jest to the correct Node.js entry
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/?(*.)+(spec|test).{ts,tsx}'],

  // Exclude only node_modules (integration tests now run with unit tests)
  testPathIgnorePatterns: ['/node_modules/'],

  // Coverage thresholds (see TESTING.md for strategy)
  coverageThreshold: {
    global: {
      // Global thresholds DISABLED - Current coverage: 0%
      // Will be re-enabled when coverage improves (target: 1%→2%→5%→10%)
      // Incremental strategy: Phase 1 (1%→2%→5%→10%), Phase 2 (10%→20%→40%)
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
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
  // FIXME: LokiJS creates internal workers that don't close cleanly.
  // The warning "worker process has failed to exit gracefully" is expected.
  // This does NOT affect test results - all tests pass correctly.
  // See: docs/TESTING.md#known-issues for details
  forceExit: true,
};

export default config;
