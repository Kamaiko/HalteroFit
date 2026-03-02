# **mocks**/ - Jest Module Mocks

**Context:** Centralized mocks for external modules (Phase 0.5.28 refactor)
**Purpose:** Enable Jest tests to run without React Native native modules
**Constraints:** Jest auto-discovery convention - MUST be at project root

## Quick Reference

```typescript
// Jest automatically uses mocks from __mocks__/ directory
// NO explicit import needed in tests!

describe('Test with mocked MMKV', () => {
  test('uses mock storage', () => {
    // react-native-mmkv is automatically mocked
    const { MMKV } = require('react-native-mmkv');
    MMKV.set('key', 'value'); // Uses __mocks__/react-native-mmkv.js
  });
});
```

## Directory Structure

```
__mocks__/
├── README.md                   # This file - Mocking guide
├── expo-asset.js               # Mock for Expo Asset API
├── react-native-mmkv.js        # Mock for MMKV storage (in-memory)
└── @supabase/
    └── supabase-js.js          # Mock for Supabase client
```

## Mock Inventory

### `expo-asset.js` - Expo Asset Mock

**Purpose:** Mock Expo's Asset API for loading images/fonts
**Why Needed:** Expo native modules don't work in Node.js/Jest
**Implementation:** Returns mock URI for all assets

```javascript
// __mocks__/expo-asset.js
const Asset = {
  fromModule: jest.fn(() => ({
    downloadAsync: jest.fn(() => Promise.resolve()),
    uri: 'mock-asset-uri',
  })),
};

module.exports = { Asset };
```

**Usage in Tests:**

```typescript
// NO explicit mock needed - Jest auto-discovers!
import { Asset } from 'expo-asset';

test('loads asset', async () => {
  const asset = Asset.fromModule(require('./logo.png'));
  await asset.downloadAsync(); // Uses mock
  expect(asset.uri).toBe('mock-asset-uri');
});
```

### `react-native-mmkv.js` - MMKV Storage Mock

**Purpose:** Mock MMKV encrypted storage with in-memory JavaScript object
**Why Needed:** MMKV requires React Native JSI (not available in Jest)
**Implementation:** In-memory key-value store with all MMKV methods

```javascript
// __mocks__/react-native-mmkv.js
const mockStorage = {}; // In-memory storage

const mockMMKV = {
  set: jest.fn((key, value) => {
    mockStorage[key] = value;
  }),
  getString: jest.fn((key) => mockStorage[key] || undefined),
  getNumber: jest.fn((key) => Number(mockStorage[key])),
  getBoolean: jest.fn((key) => Boolean(mockStorage[key])),
  delete: jest.fn((key) => {
    delete mockStorage[key];
  }),
  clearAll: jest.fn(() => {
    /* clear mockStorage */
  }),
  getAllKeys: jest.fn(() => Object.keys(mockStorage)),
  contains: jest.fn((key) => key in mockStorage),
};

module.exports = { MMKV: mockMMKV, createMMKV: jest.fn(() => mockMMKV) };
```

**Usage in Tests:**

```typescript
import { MMKV } from 'react-native-mmkv';

test('stores data', () => {
  MMKV.set('user_id', 'user-123');
  expect(MMKV.getString('user_id')).toBe('user-123');

  MMKV.clearAll();
  expect(MMKV.getString('user_id')).toBeUndefined();
});
```

### `@supabase/supabase-js.js` - Supabase Client Mock

**Purpose:** Mock Supabase client to prevent network calls during tests
**Why Needed:** Tests should not make real API calls (slow, unreliable, requires auth)
**Implementation:** Mock all Supabase methods (auth, database, storage)

**Mocked in jest.setup.ts:**

```typescript
// jest.setup.ts
jest.mock('@/services/supabase/client'); // Mock our wrapper, not supabase-js directly
```

**Usage in Tests:**

```typescript
import { supabase } from '@/services/supabase/client';

test('queries workouts', async () => {
  // supabase is automatically mocked
  const { data, error } = await supabase.from('workouts').select();
  // Returns mock data (no real API call)
});
```

## Mocking Strategy

### Automatic Mocking (Preferred)

**How:** Place mock in `__mocks__/` directory matching module path
**When:** External native modules (expo-asset, react-native-mmkv)
**Benefits:** Jest auto-discovers, no manual setup needed

```
__mocks__/
├── expo-asset.js           # Automatically mocks 'expo-asset'
└── react-native-mmkv.js    # Automatically mocks 'react-native-mmkv'
```

### Manual Mocking (When Needed)

**How:** Call `jest.mock('module-path')` in jest.setup.ts or test file
**When:** Internal modules (our own code like @/services/supabase/client)
**Benefits:** More control, can mock per-test

```typescript
// jest.setup.ts
jest.mock('@/services/supabase/client'); // Mock our internal module

// OR in test file
jest.mock('@/services/database/workouts', () => ({
  createWorkout: jest.fn(),
}));
```

## Decision Records

### Why **mocks**/ at Project Root (not src/**mocks**/)?

**Question:** Why place mocks at `__mocks__/` instead of `src/__mocks__/`?

**Answer:** Jest Convention + Auto-Discovery

**Reasoning:**

1. **Jest convention:** `__mocks__/` at root is Jest's auto-discovery pattern
2. **External modules:** Mocking `react-native-mmkv` requires `__mocks__/react-native-mmkv.js` at root
3. **Not source code:** Mocks are test infrastructure, not app code
4. **Clear separation:** `__mocks__/` = test mocks, `src/` = app code

**Jest Auto-Discovery:**

```
Project root:
├── __mocks__/
│   └── react-native-mmkv.js    # ✅ Jest auto-discovers this
└── src/
    └── __mocks__/              # ❌ Jest does NOT auto-discover this
        └── react-native-mmkv.js
```

**Reference:** [Jest Manual Mocks](https://jestjs.io/docs/manual-mocks)

### Why Mock Native Modules (not Use Real Modules in Jest)?

**Question:** Why mock native modules instead of using real implementations in tests?

**Answer:** Node.js ≠ React Native Environment

**Limitations:**

1. **No JSI:** Jest runs in Node.js, React Native JSI unavailable
2. **No native modules:** Cannot load .so/.dylib files in Node.js
3. **Performance:** Real modules slower, mocks faster
4. **Test isolation:** Real modules may have side effects (network, disk I/O)

**Example:**

```
react-native-mmkv:
- Production: Uses React Native JSI → C++ encrypted storage (fast, secure)
- Jest: Cannot use JSI → Must mock with JavaScript object (in-memory)

Supabase:
- Production: Makes real API calls to Supabase backend
- Jest: Mock to avoid network calls (faster, deterministic)
```

### Why Mock Our Supabase Client (not Supabase SDK Directly)?

**Question:** Why mock `@/services/supabase/client` instead of `@supabase/supabase-js`?

**Answer:** Test Our Integration, Not Supabase SDK

**Reasoning:**

1. **Trust third-party SDK:** Supabase SDK is already tested by Supabase team
2. **Test our code:** We care about OUR client wrapper, not Supabase internals
3. **Simpler mocks:** Mocking our wrapper = fewer methods to mock
4. **Realistic:** Tests use same import path as production code

**Example:**

```typescript
// ❌ BAD: Mock Supabase SDK directly
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    /* 50+ methods to mock */
  })),
}));

// ✅ GOOD: Mock our wrapper
jest.mock('@/services/supabase/client'); // Only mock methods we actually use
```

## Import Patterns

### ✅ GOOD: Automatic mock usage

```typescript
// Jest auto-discovers __mocks__/react-native-mmkv.js
import { MMKV } from 'react-native-mmkv';

test('uses mock', () => {
  MMKV.set('key', 'value'); // Uses mock automatically
});
```

### ✅ GOOD: Manual mock override (per-test)

```typescript
jest.mock('@/services/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

test('queries workouts', async () => {
  // Uses custom mock for this test only
});
```

### ❌ BAD: Mixing real and mocked modules

```typescript
// ❌ Inconsistent - some tests use real MMKV, others use mock
test('test 1', () => {
  jest.unmock('react-native-mmkv'); // Use real module
  const { MMKV } = require('react-native-mmkv'); // FAILS in Jest!
});

test('test 2', () => {
  const { MMKV } = require('react-native-mmkv'); // Uses mock
});
```

### ❌ BAD: Not resetting mocks between tests

```typescript
test('test 1', () => {
  MMKV.set('key', 'value');
  expect(MMKV.getString('key')).toBe('value');
});

test('test 2', () => {
  // ❌ MMKV still has 'key' from test 1!
  expect(MMKV.getAllKeys()).toHaveLength(0); // FAILS
});
```

**Fix: Use jest.clearAllMocks() in beforeEach**

```typescript
// jest.setup.ts
beforeEach(() => {
  jest.clearAllMocks(); // ✅ Reset all mocks before each test
});
```

## Anti-Patterns

### ❌ BAD: Committing mock data in production code

```typescript
// src/services/supabase/client.ts
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'MOCK_URL', // ❌ Don't use mock fallbacks in production
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'MOCK_KEY'
);
```

**Fix: Use mocks ONLY in tests**

```typescript
// src/services/supabase/client.ts (production)
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL, // ✅ No mock fallback
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// jest.setup.ts (test environment)
jest.mock('@/services/supabase/client'); // ✅ Mock for tests
```

### ❌ BAD: Over-mocking (mocking internal code unnecessarily)

```typescript
// ❌ Mocking our own database functions
jest.mock('@/services/database/workouts', () => ({
  createWorkout: jest.fn(),
  getWorkout: jest.fn(),
  // ... mocking everything defeats the purpose of testing
}));
```

**Fix: Only mock external dependencies**

```typescript
// ✅ Mock external native module
jest.mock('react-native-mmkv');

// ✅ Test our internal code (don't mock)
import { createWorkout } from '@/services/database/workouts';
test('creates workout', async () => {
  const workout = await createWorkout(database, data); // Tests real implementation
});
```

### ❌ BAD: Not providing complete mock API

```typescript
// __mocks__/react-native-mmkv.js
module.exports = {
  MMKV: {
    set: jest.fn(), // ❌ Only mocked 'set', missing getString, delete, etc.
  },
};
```

**Fix: Mock all used methods**

```typescript
module.exports = {
  MMKV: {
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(),
    contains: jest.fn(),
  },
};
```

## Cross-References

- **Test Root README:** [tests/README.md](../tests/README.md) - Architecture overview
- **Database Helpers:** [tests/support/database/README.md](../tests/support/database/README.md) - Test utilities
- **Jest Setup:** [jest.setup.ts](../jest.setup.ts) - Global test configuration
- **Jest Config:** [jest.config.ts](../jest.config.ts) - Jest configuration
- **Unit Testing Guide:** [docs/testing/unit-guide.md](../docs/testing/unit-guide.md) (future)

## Debugging Mocks

### View Mock Calls

```typescript
import { MMKV } from 'react-native-mmkv';

test('tracks mock calls', () => {
  MMKV.set('key', 'value');

  // View all calls to 'set'
  console.log(MMKV.set.mock.calls);
  // [ ['key', 'value'] ]

  // Assert call count
  expect(MMKV.set).toHaveBeenCalledTimes(1);

  // Assert call arguments
  expect(MMKV.set).toHaveBeenCalledWith('key', 'value');
});
```

### Reset Mock State

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Clear call history + mock implementations

  // OR individually:
  MMKV.set.mockClear(); // Clear call history only
  MMKV.set.mockReset(); // Clear + reset to default implementation
});
```

### Override Mock Per Test

```typescript
test('custom mock response', () => {
  MMKV.getString.mockReturnValueOnce('custom-value');

  expect(MMKV.getString('key')).toBe('custom-value');
  expect(MMKV.getString('key')).toBeUndefined(); // Back to default
});
```

## Migration Notes (Phase 0.5.28 Refactor)

**What Changed:**

```
BEFORE:
__mocks__/
├── src/                        # ❌ Duplicate structure (removed)
│   └── services/
│       └── supabase/
│           └── client.ts
├── expo-asset.js
└── react-native-mmkv.js

AFTER:
__mocks__/
├── README.md                   # 🆕 Mocking guide
├── expo-asset.js               # ✅ Kept (automatic mock)
├── react-native-mmkv.js        # ✅ Kept (automatic mock)
└── @supabase/
    └── supabase-js.js          # ✅ Kept (scoped package mock)

jest.setup.ts:
jest.mock('@/services/supabase/client'); # ✅ Mock our wrapper instead
```

**Benefits:**

- **Cleaner:** No duplicate `__mocks__/src/` structure
- **Standard:** Follows Jest conventions
- **Maintainable:** Fewer mock files to update

## Resources

**Jest Mocking:**

- Manual Mocks: https://jestjs.io/docs/manual-mocks
- Mock Functions: https://jestjs.io/docs/mock-functions
- ES6 Module Mocks: https://jestjs.io/docs/es6-class-mocks

**React Native Testing:**

- Testing Overview: https://reactnative.dev/docs/testing-overview
- Jest Setup: https://jestjs.io/docs/tutorial-react-native
- React Native Testing Library: https://callstack.github.io/react-native-testing-library/

**Module-Specific:**

- MMKV Testing: https://github.com/mrousavy/react-native-mmkv#testing
- Supabase Testing: https://supabase.com/docs/guides/getting-started/testing
- Expo Asset: https://docs.expo.dev/versions/latest/sdk/asset/
