# Testing

Testing strategy and conventions for Halterofit. Risk-calibrated test density, LokiJS in-memory adapter for Jest, Maestro E2E for real SQLite.

## Quick Start

```bash
pnpm test                       # Run all tests (from apps/mobile)
pnpm test -- --coverage         # Coverage report
pnpm test -- filename.test      # Run specific file
```

E2E tests (Maestro) are planned for Phase 3+ when sync protocol testing begins. See `.maestro/README.md`.

**Writing tests:** Use the `test-engineer` agent in Claude Code for writing risk-calibrated tests or auditing existing test coverage. It analyzes source code and writes only tests justified by risk level.

---

## Strategy

### Two Tiers

| Tier     | Speed   | Environment          | Scope                                                       |
| -------- | ------- | -------------------- | ----------------------------------------------------------- |
| **Jest** | <10s    | Node.js + LokiJS     | Unit tests: hooks, services, validators, pure functions     |
| **E2E**  | 5-10min | Real Device + SQLite | Sync protocol, complete user flows, real backend validation |

Jest runs in Node.js where SQLite's JSI bridge is unavailable. LokiJS provides real WatermelonDB behavior (models, collections, queries, relationships) in-memory. `msw` is installed for future integration tests when sync features are implemented.

### What Jest Cannot Test

All tests run in Jest with LokiJS unless they require real SQLite. Defer these to E2E:

- Sync protocol columns (`_changed`, `_status`)
- `synchronize()` push/pull operations
- Schema migrations on real SQLite
- Multi-device conflict resolution

---

## Writing Tests

### Test Density by Risk

Allocate test effort by **risk**, not function type.

| Risk Level                 | Density                                       | What Qualifies                                         |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| **Data loss / corruption** | Thorough — happy path + edge cases + boundary | Cascade deletes, batch writes, reorder persistence     |
| **Business rule boundary** | Boundary — happy path + at-limit + over-limit | Exercise limits, day count limits, name validation     |
| **Wiring / delegation**    | Smoke — 1 test proving context enrichment     | Throwing wrappers over result-based validators         |
| **Cross-cutting plumbing** | Representative — 1 per file                   | Auth guards, ownership checks                          |
| **Framework glue**         | Skip                                          | ORM field assignment, getter/setter, Zustand internals |

### Principles

1. **Test behavior, not implementation.** Assert observable outcomes, not internal delegation or error priority.
2. **Don't re-test through the call stack.** If a pure validator covers limit/duplicate errors, don't re-assert them through calling service functions.
3. **Pure > service tests.** Prefer testing logic in pure functions. Service tests verify orchestration and integration points.
4. **Cross-cutting concerns once per file.** Auth and ownership use the same pattern everywhere — 1 representative test proves the wiring.
5. **Name tests by behavior.** `'cascades exercises when day is deleted'` not `'calls markAsDeleted on PlanDayExercise records'`.

### Critical Rules

| Rule                                                   | Why                  | Consequence if Broken                  |
| ------------------------------------------------------ | -------------------- | -------------------------------------- |
| `resetTestIdCounter()` in `beforeAll` after DB created | Deterministic IDs    | Tests pass individually, fail in suite |
| `await cleanupTestDatabase(database)` in `afterEach`   | Prevent memory leaks | Tests timeout, database locked         |
| Create database in `beforeAll`, not `beforeEach`       | Shared instance      | Jest hangs from excessive workers      |
| Always `await` database operations                     | Async writes         | Race conditions, data not saved        |
| Use `@test-helpers/*` aliases, not relative imports    | Works from any depth | Import errors when files move          |
| Never query `_changed`, `_status` in Jest              | LokiJS unsupported   | `no such column: _changed`             |
| Always wrap writes in `database.write()`               | Transaction required | `Cannot modify database outside write` |

---

## Infrastructure

### Directory Structure

```
__tests__/
├── unit/
│   ├── hooks/workout/
│   ├── services/database/
│   └── utils/
└── __helpers__/
    └── database/

__mocks__/

.maestro/
```

### Test Helpers

| Helper                   | Purpose               | Key Functions                                                    |
| ------------------------ | --------------------- | ---------------------------------------------------------------- |
| `database/test-database` | LokiJS setup/teardown | `createTestDatabase`, `cleanupTestDatabase`                      |
| `database/factories`     | Create test data      | `createTestWorkout`, `createTestExercise`, `resetTestIdCounter`  |
| `database/queries`       | Query utilities       | `getAllRecords`, `getRecordById`, `countRecords`, `recordExists` |

Import via `@test-helpers/*` aliases configured in `jest.config.ts` and `tsconfig.json`.

### Mocks

| Module                  | Location                         | Purpose                  |
| ----------------------- | -------------------------------- | ------------------------ |
| `react-native-mmkv`     | `__mocks__/react-native-mmkv.js` | In-memory storage (Map)  |
| `expo-asset`            | `__mocks__/expo-asset.js`        | Mock `Asset.loadAsync()` |
| `@supabase/supabase-js` | `__mocks__/@supabase/`           | Mock auth & API calls    |

---

## CI Integration

Tests run on every pull request via GitHub Actions. Two required checks execute in parallel: **Lint** (ESLint, Prettier, TypeScript, Expo Doctor) and **Test** (Jest with coverage). LokiJS autosave is disabled in the test adapter (`extraLokiOptions: { autosave: false }`) to prevent open handles that would keep Jest alive.

See [PIPELINE.md](../reference/PIPELINE.md) for full CI/CD details.

---

## Troubleshooting

| Error                                                       | Root Cause                     | Fix                                                           |
| ----------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| `Cannot find module '@test-helpers/...'`                    | Alias not configured           | Add to `jest.config.ts` + `tsconfig.json` paths               |
| `LokiJS: Table 'workouts' not found`                        | Database not initialized       | Add `createTestDatabase()` in `beforeAll`                     |
| `Test IDs inconsistent between runs`                        | `resetTestIdCounter()` missing | Call in `beforeAll()` after `createTestDatabase()`            |
| `Jest hangs or won't exit`                                  | Too many database instances    | Use shared instance pattern (`beforeAll` not `beforeEach`)    |
| `Jest did not exit one second after the test run completed` | LokiJS autosave timer open     | Fixed: autosave disabled in test adapter (`extraLokiOptions`) |
