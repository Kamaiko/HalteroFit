import type { Config } from 'jest';

// Shared config between unit and integration test projects
const sharedConfig = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@nozbe/watermelondb|msw|@mswjs|until-async)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test-helpers/(.*)$': '<rootDir>/__tests__/__helpers__/$1',
    '^@tests/(.*)$': '<rootDir>/__tests__/$1',
    // msw v2 uses conditional exports - point Jest to the correct Node.js entry
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
  },
  testPathIgnorePatterns: ['/node_modules/'],
  cacheDirectory: '.jest-cache',
};

const config: Config = {
  projects: [
    {
      ...sharedConfig,
      displayName: 'unit',
      testMatch: ['<rootDir>/__tests__/unit/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    },
    {
      ...sharedConfig,
      displayName: 'integration',
      testMatch: ['<rootDir>/__tests__/integration/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '<rootDir>/__tests__/integration/setup.ts'],
    },
  ],

  // Root-level options (not valid inside projects)
  testTimeout: 30000,
  maxWorkers: '50%',
  verbose: process.env.CI === 'true',

  // Force exit after tests complete
  // Required for WatermelonDB/LokiJS which keeps worker threads open
  // See: docs/TESTING.md#known-issues for details
  forceExit: true,

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '__tests__/__helpers__/network/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],

  // Coverage thresholds (see TESTING.md for strategy)
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
    './src/services/database/': {
      branches: 0,
      functions: 1,
      lines: 1,
      statements: 1,
    },
  },
};

export default config;
