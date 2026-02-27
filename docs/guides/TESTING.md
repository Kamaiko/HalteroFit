# Testing

This document outlines the complete testing strategy for Halterofit. Use this as a reference for writing tests and understanding coverage requirements.

> "Write tests. Not too many. Mostly integration." - Kent C. Dodds

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Writing Tests](#writing-tests)
4. [Test Infrastructure](#test-infrastructure)
5. [Coverage & Metrics](#coverage--metrics)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### Two-Tier Testing Strategy

| Type          | Speed   | Environment          | Purpose                                                     |
| ------------- | ------- | -------------------- | ----------------------------------------------------------- |
| **Jest**      | <10s    | Node.js + LokiJS     | Unit tests: hooks, services, validators, pure functions     |
| **E2E Tests** | 5-10min | Real Device + SQLite | Sync protocol, complete user flows, real backend validation |

**Test Suite:** Run `npm test` to see current count

### Quick Commands

```bash
# Jest (unit tests)
npm test                       # Run all tests
npm test -- --coverage         # Coverage report
npm test -- filename.test      # Run specific file

# E2E (Maestro — Phase 3+)
maestro test .maestro/              # Run all E2E flows
maestro test .maestro/flows/auth/   # Run auth flows only
```

---

## Testing Strategy

### Decision Tree: Which Test Type?

```
Can I test this in Jest with LokiJS (in-memory)?
│
├─ YES: Does it involve _changed, _status, or synchronize()?
│   ├─ NO → Jest unit test
│   └─ YES → E2E Only (Real SQLite required)
│
└─ NO: Need real device/SQLite?
    ├─ One-off scenario → Manual E2E
    └─ Repeatable flow → Maestro E2E
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

### Integration Tests (Future — msw)

> **Status:** `msw` is installed but has no active tests. Integration test infrastructure was removed because the original tests validated mock plumbing, not application code. When sync features are implemented, re-add integration tests that call actual app functions (e.g., `syncDatabase()`) with MSW intercepting Supabase RPC endpoints.

### E2E Tests (Maestro)

**Location:** `.maestro/flows/`

E2E tests use Maestro with real devices and SQLite. Use for scenarios that cannot be tested in Jest.

**When to Use:**

- Sync protocol testing (\_changed, \_status)
- Complete user journeys (login, workout creation)
- Migrations (schema changes)
- Regression testing before releases

**Run:** `maestro test .maestro/`

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

### Test Density by Layer

Not all code deserves the same test density. Allocate effort by **risk**, not function type.

| Risk Level                 | Density                                       | What qualifies                                         |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| **Data loss / corruption** | Thorough — happy path + edge cases + boundary | cascade deletes, batch writes, reorder persistence     |
| **Business rule boundary** | Boundary — happy path + at-limit + over-limit | exercise limits, day count limits, name validation     |
| **Wiring / delegation**    | Smoke — 1 test proving context enrichment     | throwing wrappers over result-based validators         |
| **Cross-cutting plumbing** | Representative — 1 per file                   | auth guards, ownership checks                          |
| **Framework glue**         | Skip                                          | ORM field assignment, getter/setter, Zustand internals |

**Key principles:**

1. **Test behavior, not implementation.** Assert observable outcomes, not internal delegation or error priority.
2. **Don't re-test through the call stack.** If a pure validator covers limit/duplicate errors, don't re-assert them through calling service functions.
3. **Pure > service tests.** Prefer testing logic in pure functions. Service tests verify orchestration and integration points — including business logic that only emerges through orchestration (e.g., deletion-count adjustment before limit check).
4. **Cross-cutting concerns once per file.** Auth and ownership use the same pattern everywhere — 1 representative test proves the wiring.
5. **Name tests by behavior.** `'cascades exercises when day is deleted'` not `'calls markAsDeleted on PlanDayExercise records'`.

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
__tests__/                      # All Jest tests
├── unit/                       # Unit tests (Jest + LokiJS)
│   ├── hooks/workout/          # Hook tests (useAddDayDialog, useDayMenu, etc.)
│   ├── services/database/      # Service function tests (day-operations)
│   └── utils/                  # Utility function tests (muscles, validators)
│
├── __helpers__/                # Reusable test utilities
│   └── database/               # Database helpers (factories, queries, time, test-database)

.maestro/                       # E2E tests (Maestro — Phase 3+)

__mocks__/                      # Jest auto-discovery mocks
```

### Module Aliases

```typescript
// ✅ GOOD: Use aliases (works from anywhere)
import { createTestWorkout } from '@test-helpers/database/factories';
import { getAllRecords } from '@test-helpers/database/queries';

// ❌ BAD: Relative imports (fragile)
import { createTestWorkout } from '../../../__helpers__/database/factories';
```

### Test Helpers Overview

| Helper                   | Purpose               | Key Functions                                             |
| ------------------------ | --------------------- | --------------------------------------------------------- |
| `database/test-database` | LokiJS setup/teardown | createTestDatabase, cleanupTestDatabase                   |
| `database/factories`     | Create test data      | createTestWorkout, createTestExercise, resetTestIdCounter |
| `database/queries`       | Query utilities       | getAllRecords, getRecordById, countRecords, recordExists  |

### Mocking Strategy

| Module                  | Location                         | Purpose                 |
| ----------------------- | -------------------------------- | ----------------------- |
| `react-native-mmkv`     | `__mocks__/react-native-mmkv.js` | In-memory storage (Map) |
| `expo-asset`            | `__mocks__/expo-asset.js`        | Mock Asset.loadAsync()  |
| `@supabase/supabase-js` | `__mocks__/@supabase/`           | Mock auth & API calls   |

---

## Coverage & Metrics

### Current Status

| Metric             | Value      | Target | Status |
| ------------------ | ---------- | ------ | ------ |
| **Total Tests**    | `npm test` | —      | —      |
| **Execution Time** | ~5s        | <10s   | 100%   |

**Covered:** Hooks, service functions, validators, muscle mapping
**NOT Covered:** Sync protocol, migrations, WatermelonDB queries (E2E only)

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
   - Solution: `forceExit: true` configured in `jest.config.ts`
   - Impact: None - tests complete successfully, Jest exits cleanly

2. **"A worker process has failed to exit gracefully and has been force exited"**
   - Cause: Same as above - LokiJS workers don't gracefully close
   - Solution: Same as above - `forceExit: true` handles this
   - Impact: None - this is the expected behavior

**Why `forceExit: true` is safe here:**

- ✅ Tests complete successfully (all assertions pass)
- ✅ No actual memory leaks (workers are cleaned up by Node.js on exit)
- ✅ Tests run fast (~5-10s)
- ✅ Alternative would require custom worker management (overcomplicated)
- ✅ Industry standard for in-memory database testing with workers

---

**Version:** 7.0 (Post-audit cleanup — unit tests only, integration deferred to E2E)
