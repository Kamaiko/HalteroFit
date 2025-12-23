# Testing - Halterofit

This document outlines the complete testing strategy for Halterofit, including unit tests (Jest), integration tests (msw), and E2E testing (Maestro). Use this as a reference for writing tests and understanding coverage requirements.

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Writing Tests](#writing-tests)
4. [Test Infrastructure](#test-infrastructure)
5. [Coverage & Metrics](#coverage--metrics)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### Three-Tier Testing Strategy

| Type                  | Speed   | Environment               | Purpose                                                                            |
| --------------------- | ------- | ------------------------- | ---------------------------------------------------------------------------------- |
| **Unit Tests**        | <5s     | Node.js + LokiJS          | Test isolated business logic: CRUD operations, queries, relationships, validations |
| **Integration Tests** | 5-30s   | Node.js + Mock APIs (msw) | Test sync protocol logic: conflict resolution, offline behavior, network scenarios |
| **E2E Tests**         | 5-10min | Real Device + SQLite      | Test complete user flows: login → workout → sync with real backend                 |

**Test Suite:** 31 unit tests + 38 integration tests

### Quick Commands

```bash
# Unit tests
npm test                  # Run all unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm test -- filename.test # Run specific file

# Integration tests
npm run test:integration         # Run sync integration tests
npm run test:integration:watch   # Watch mode
```

---

## Testing Strategy

### Decision Tree: Which Test Type?

```
Can I test this in Jest with LokiJS (in-memory)?
│
├─ YES: Does it involve _changed, _status, or synchronize()?
│   ├─ NO → Unit Test (Jest + LokiJS)
│   └─ YES → E2E Only (Real SQLite required)
│
└─ NO: Need real device/SQLite?
    ├─ One-off scenario → Manual E2E
    ├─ Repeatable flow → Maestro E2E (Phase 3+)
    └─ Cross-service → Integration Test
```

### Unit Tests (Jest + LokiJS)

**What to Test:**

- CRUD operations (create, read, update, delete)
- Queries (filter, sort, paginate with Q.where)
- Relationships (belongs_to, has_many associations)
- Business logic (computed properties, validations)
- Timestamps (created_at, updated_at with fuzzy matching)

**What NOT to Test:**

- Sync protocol (\_changed, \_status columns)
- synchronize() method (push/pull to backend)
- Migrations (schema changes with real SQLite)
- Conflict resolution (multi-device scenarios)

**Why LokiJS?** Jest runs in Node.js. SQLite requires React Native JSI (not available in Node). LokiJS provides real WatermelonDB behavior in Node.js.

### Integration Tests

**Coverage:** 38 tests implemented

**When to Use:**

- Sync protocol validation (pull/push changes to Supabase backend)
- Conflict resolution scenarios (last write wins, multi-device)
- Offline-first behavior (offline create/update/delete, resume sync)
- Network resilience (slow connections, intermittent failures)
- Schema validation (Zod validators for sync payloads)

**Infrastructure:**

- `msw` - Mock Supabase RPC endpoints (pull_changes, push_changes)
- `network-simulator` - Simulate offline/slow/intermittent connections
- `sync-fixtures` - Generate realistic test data (workouts, conflicts, edge cases)

**Current Coverage:**

- sync-basic.test.ts - 11 tests (pull/push/bidirectional)
- conflict-resolution.test.ts - 11 tests (last write wins, multi-device)
- schema-validation.test.ts - 16 tests (Zod validation)

**Important Limitation:**
Integration tests use LokiJS (in-memory), NOT Real SQLite. WatermelonDB sync protocol columns (\_changed, \_status) and synchronize() method require native SQLite module, only available in E2E tests. Integration tests validate sync LOGIC, E2E tests validate sync PROTOCOL.

**Run:** `npm run test:integration`

### E2E Tests

**Manual E2E (Current):**

- Sync protocol testing (\_changed, \_status)
- Migrations (schema changes)
- One-off validation before automation
- Speed: 15-20 minutes (includes build + device testing)

**Maestro E2E (Phase 1+):**

- High-value user journeys (login, workout creation)
- Regression testing before releases
- Speed: 2-5 minutes (automated)
- Status: Planned for Phase 1+ (Task 1.22)
- Directory: `.maestro/` at project root

---

## Writing Tests

### Standard Test Pattern

```typescript
import { createTestDatabase, cleanupTestDatabase } from '@test-helpers/database/test-database';
import { createTestWorkout, resetTestIdCounter } from '@test-helpers/database/factories';

describe('Workouts', () => {
  let database: Database;

  beforeAll(() => {
    database = createTestDatabase(); // Create ONCE per suite
    resetTestIdCounter();
  });

  afterEach(async () => {
    await cleanupTestDatabase(database); // Reset data between tests
  });

  it('creates a workout with default values', async () => {
    const workout = await createTestWorkout(database);

    expect(workout.id).toBeDefined();
    expect(workout.startedAt).toBeInstanceOf(Date);
  });
});
```

**Critical:** Use `beforeAll` (NOT `beforeEach`) to create shared database instance. Prevents Jest hanging by creating worker handles only once per suite.

### Critical Rules

| Rule                                                         | Why                      | Consequence if Broken                  |
| ------------------------------------------------------------ | ------------------------ | -------------------------------------- |
| `resetTestIdCounter()` in `beforeAll` AFTER database created | Deterministic IDs        | Tests pass individually, fail in suite |
| `await cleanupTestDatabase(database)` in `afterEach`         | Prevent memory leaks     | Tests timeout, database locked         |
| Always `await` database operations                           | Async writes             | Race conditions, data not saved        |
| Use `@test-helpers/*` aliases (NOT relative imports)         | Works from any depth     | Import errors when files move          |
| Never query `_changed`, `_status` in Jest                    | LokiJS doesn't support   | `no such column: _changed`             |
| Never call `synchronize()` in Jest                           | Requires real SQLite     | Not a function error                   |
| Always wrap writes in `database.write()`                     | Writes must transactable | `Cannot modify database outside write` |

### WatermelonDB-Specific Patterns

**Relationships:**

```typescript
const exercises = await workout.exercises.fetch(); // has_many
const parentWorkout = await exercise.workout.fetch(); // belongs_to
```

**Queries (Q.where syntax):**

```typescript
import { Q } from '@nozbe/watermelondb';

// Filter
const completed = await database
  .get('workouts')
  .query(Q.where('completed_at', Q.notEq(null)))
  .fetch();

// Sort + paginate
const recent = await database.get('workouts').query(Q.sortBy('created_at', Q.desc), Q.take(10)).fetch();
```

**Timestamps (fuzzy matching):**

```typescript
import { assertDatesApproximatelyEqual } from '@test-helpers/database/assertions';

const before = new Date();
const workout = await createTestWorkout(database);
const after = new Date();

assertDatesApproximatelyEqual(workout.createdAt, before, after); // ±50ms tolerance
```

### Top 3 Anti-Patterns

**1. `beforeEach` database creation (causes Jest hangs):**

```typescript
// ❌ WRONG: Creates worker leaks
beforeEach(() => {
  database = createTestDatabase(); // Worker created 36 times!
});

// ✅ CORRECT: Shared instance
beforeAll(() => {
  database = createTestDatabase(); // Worker created ONCE
});
```

**2. Testing sync protocol in Jest:**

```typescript
// ❌ WRONG: LokiJS doesn't support sync columns
const changed = await workout._changed; // Error: no such column

// ✅ CORRECT: Move to E2E tests (real SQLite)
```

**3. Missing cleanup:**

```typescript
// ❌ WRONG: State leaks to next test
afterEach(async () => {
  // Missing cleanup!
});

// ✅ CORRECT: Always clean up
afterEach(async () => {
  await cleanupTestDatabase(database);
});
```

---

## Test Infrastructure

### Directory Structure

```
__tests__/
├── unit/                       # Unit tests (Jest + LokiJS)
│   ├── services/database/      # Database CRUD tests
│   ├── services/auth/          # Auth tests (Phase 1+)
│   └── utils/                  # Utility function tests
│
├── integration/                # Integration tests
│   ├── database/               # Database sync (38 tests)
│   ├── workflows/              # Multi-service workflows
│   └── features/               # Cross-component features
│
├── __helpers__/                # Reusable test utilities
│   ├── database/               # Database helpers
│   └── network/                # Network helpers (msw, simulator)
│
└── fixtures/                   # Static test data (JSON)

e2e/                            # E2E tests (outside __tests__)
├── manual/                     # Manual E2E documentation
└── maestro/                    # Maestro automation (Phase 1+)

__mocks__/                      # Jest auto-discovery mocks
```

### Module Aliases

```typescript
// ✅ GOOD: Use aliases (works from anywhere)
import { createTestWorkout } from '@test-helpers/database/factories';
import { getAllRecords } from '@test-helpers/database/queries';
import { setupMockSupabase } from '@test-helpers/network/mock-supabase';
import workoutFixtures from '@tests/fixtures/database/workouts.json';

// ❌ BAD: Relative imports (fragile)
import { createTestWorkout } from '../../../__helpers__/database/factories';
```

### Test Helpers Overview

| Helper                      | Purpose                   | Key Functions                                                |
| --------------------------- | ------------------------- | ------------------------------------------------------------ |
| `database/test-database`    | LokiJS setup/teardown     | createTestDatabase, cleanupTestDatabase                      |
| `database/factories`        | Create test data          | createTestWorkout, createTestExercise, resetTestIdCounter    |
| `database/queries`          | Query utilities           | getAllRecords, countRecords, recordExists                    |
| `database/time`             | Time utilities            | wait, dateInPast, dateInFuture                               |
| `database/assertions`       | Custom assertions         | assertDatesApproximatelyEqual                                |
| `network/mock-supabase`     | Mock Supabase backend     | setupMockSupabase, mockPullChanges, mockPushChanges          |
| `network/network-simulator` | Network conditions        | simulateOffline, simulateSlow, simulateIntermittent          |
| `network/sync-fixtures`     | Sync test data generators | generateWorkoutChanges, generateConflicts, generateEdgeCases |

### Mocking Strategy

| Module                  | Location                         | Purpose                 |
| ----------------------- | -------------------------------- | ----------------------- |
| `react-native-mmkv`     | `__mocks__/react-native-mmkv.js` | In-memory storage (Map) |
| `expo-asset`            | `__mocks__/expo-asset.js`        | Mock Asset.loadAsync()  |
| `@supabase/supabase-js` | `jest.setup.ts`                  | Mock auth & API calls   |
| `@sentry/react-native`  | `jest.setup.ts`                  | Mock error tracking     |

---

## Coverage & Metrics

### Current Status

| Metric             | Value  | Target        | Status |
| ------------------ | ------ | ------------- | ------ |
| **Total Tests**    | 69     | 80+ (Phase 1) | 86%    |
| **Database Layer** | 60-65% | 80%           | 75%    |
| **Execution Time** | ~5s    | <10s          | 100%   |

**Covered:** CRUD, queries, relationships, timestamps, sync logic
**NOT Covered:** Sync protocol, migrations (E2E only)

### Per Model

| Model           | Tests | Coverage | Priority           |
| --------------- | ----- | -------- | ------------------ |
| Workout         | 13    | ~70%     | ✅ Good            |
| Exercise        | 10    | ~60%     | Increase to 80%    |
| ExerciseSet     | 11    | ~65%     | Increase to 80%    |
| WorkoutExercise | 0     | 0%       | ❌ Phase 1 blocker |
| User            | 0     | 0%       | ❌ Phase 1 blocker |

**View Coverage:** `npm test -- --coverage` → Opens `coverage/lcov-report/index.html`

---

## Troubleshooting

### Common Errors

| Error                                                       | Root Cause                     | Fix                                                        |
| ----------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------- |
| `Cannot find module '@test-helpers/...'`                    | Alias not configured           | Add to `jest.config.ts` + `tsconfig.json` paths            |
| `LokiJS: Table 'workouts' not found`                        | Database not initialized       | Add `createTestDatabase()` in `beforeAll`                  |
| `Test IDs inconsistent between runs`                        | `resetTestIdCounter()` missing | Call in `beforeAll()` after `createTestDatabase()`         |
| `Jest hangs or won't exit`                                  | Too many database instances    | Use shared instance pattern (`beforeAll` not `beforeEach`) |
| `Jest did not exit one second after the test run completed` | LokiJS workers remain open     | Already fixed: `forceExit: true` in `jest.config.ts`       |

### Database Lifecycle Pattern

**Problem:** Jest hangs or won't exit after tests complete

**Root Cause:** Creating too many database instances creates excessive worker handles

**Solution:** Use shared database instance (one DB per test suite)

```typescript
// ✅ CORRECT: Create once per suite
beforeAll(() => {
  database = createTestDatabase(); // Worker created ONCE
  resetTestIdCounter();
});

afterEach(async () => {
  await cleanupTestDatabase(database); // Reset data between tests
});

// ❌ WRONG: Create for every test
beforeEach(() => {
  database = createTestDatabase(); // Worker created 36 times!
});
```

**Why This Works:**

- LokiJS adapter doesn't provide close() method (by design)
- Shared instance creates worker handles only once per suite
- Data isolation maintained via cleanupTestDatabase()
- Industry-standard pattern for in-memory database testing

**Note on Jest Exit Warning:**

You may see either of these warnings (both are expected and harmless):

1. **"Jest did not exit one second after the test run has completed"**
   - Cause: LokiJS adapter keeps worker threads open (no close() method by design)
   - Solution: `forceExit: true` configured in `jest.config.ts` (line 56)
   - Impact: None - tests complete successfully, Jest exits cleanly

2. **"A worker process has failed to exit gracefully and has been force exited"**
   - Cause: Same as above - LokiJS workers don't gracefully close
   - Solution: Same as above - `forceExit: true` handles this
   - Impact: None - this is the expected behavior

**Why `forceExit: true` is safe here:**

- ✅ Tests complete successfully (all assertions pass)
- ✅ No actual memory leaks (workers are cleaned up by Node.js on exit)
- ✅ Tests run fast (~5-10s for 31 tests)
- ✅ Alternative would require custom worker management (overcomplicated)
- ✅ Industry standard for in-memory database testing with workers

---

**Version:** 5.0 (Refactored - Single Source of Truth)
**Maintainer:** Patrick Patenaude + AI Agents
