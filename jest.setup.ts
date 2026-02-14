// Extend Jest matchers with react-native-specific matchers
// Note: @testing-library/react-native v12.4+ includes matchers built-in
// No need to import extend-expect anymore

// Mock Expo globals
declare global {
  var __ExpoImportMetaRegistry: Map<string, unknown>;
}

global.__ExpoImportMetaRegistry = new Map();

// Polyfill structuredClone for older Node.js versions (< 17)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = <T>(val: T): T => JSON.parse(JSON.stringify(val));
}

// Mock environment variables for Supabase (prevents errors during module loading)
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock console noise in tests (keep error visible for debugging)
// Set DEBUG_WATERMELON=1 to see WatermelonDB logs during test debugging
global.console = {
  ...console,
  log: process.env.DEBUG_WATERMELON ? console.log : jest.fn(), // Silence WatermelonDB logs
  warn: jest.fn(),
  // error intentionally NOT mocked — real errors should be visible in test output
};

// All external native modules are mocked via __mocks__ directory
// This is the standard Jest approach for modules that don't exist in Node.js
// Mocked modules:
// - expo-asset
// - react-native-mmkv
// - @supabase/supabase-js

// Mock our Supabase client to avoid loading native dependencies during tests
jest.mock('@/services/supabase/client');

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Note: resetTestIdCounter() is called in each test file's beforeEach
  // (not here to avoid issues - tests explicitly call it)
});

// Custom Jest Matchers
interface CustomMatchers<R = unknown> {
  toBeValidWorkout(): R;
  toBeValidExercise(): R;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

expect.extend({
  /**
   * Assert workout object has valid structure
   * @example expect(workout).toBeValidWorkout()
   */
  toBeValidWorkout(received: unknown): jest.CustomMatcherResult {
    const pass =
      received !== null &&
      typeof received === 'object' &&
      'id' in received &&
      typeof received.id === 'string' &&
      'title' in received &&
      typeof received.title === 'string' &&
      'userId' in received &&
      typeof received.userId === 'string';

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${JSON.stringify(received)} not to be a valid workout`
          : `Expected ${JSON.stringify(received)} to be a valid workout (id, title, userId)`,
    };
  },

  /**
   * Assert exercise object has valid structure
   * @example expect(exercise).toBeValidExercise()
   */
  toBeValidExercise(received: unknown): jest.CustomMatcherResult {
    const pass =
      received !== null &&
      typeof received === 'object' &&
      'id' in received &&
      typeof received.id === 'string' &&
      'name' in received &&
      typeof received.name === 'string';

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${JSON.stringify(received)} not to be a valid exercise`
          : `Expected ${JSON.stringify(received)} to be a valid exercise (id, name)`,
    };
  },
});
