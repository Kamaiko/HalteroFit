# Technical Documentation

This document covers all technical architecture decisions (ADRs), technology stack choices, performance guidelines, and coding standards. Reference this when making technology or architecture decisions for the project.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Architecture Decisions (ADRs)](#architecture-decisions-adrs)
4. [Project Structure](#project-structure)
5. [Design System](#design-system)
6. [Database Schema](#database-schema)
7. [Security & Monitoring](#security--monitoring)
8. [Performance Guidelines](#performance-guidelines)
9. [Coding Standards](#coding-standards)
10. [UX Best Practices](#ux-best-practices)
11. [Resources](#resources)

---

## Technology Stack

**Current Production Stack (Development Build):**

| Category             | Technology                | Version | Purpose                                      |
| -------------------- | ------------------------- | ------- | -------------------------------------------- |
| **Framework**        | Expo SDK                  | 54.0.21 | React Native framework with managed workflow |
| **Language**         | TypeScript                | 5.9     | Type-safe development                        |
| **UI Library**       | React Native              | 0.81.5  | Mobile UI framework                          |
| **Styling**          | NativeWind                | v4      | Tailwind CSS for React Native                |
| **UI Components**    | React Native Reusables    | Latest  | shadcn/ui for React Native                   |
| **Icons**            | React Native Vector Icons | Latest  | 10,000+ icons (Material, Ionicons, FA)       |
| **Database**         | WatermelonDB              | 0.28.0  | Offline-first reactive database              |
| **Storage**          | MMKV                      | 4.0.0   | Encrypted key-value storage                  |
| **State Management** | Zustand                   | 5.0.8   | Lightweight global state                     |
| **Backend**          | Supabase                  | 2.78.0  | PostgreSQL + Auth + Storage                  |
| **Charts**           | Victory Native            | 41.20.1 | Data visualization (Skia-based)              |
| **Lists**            | FlashList                 | 2.2.0   | High-performance lists                       |
| **Images**           | expo-image                | 3.0.10  | Optimized image loading with caching ✅      |
| **Navigation**       | Expo Router               | 6.0.14  | File-based routing                           |
| **Error Monitoring** | Sentry                    | 7.4.0   | Crash reporting and monitoring               |
| **Build**            | EAS Build                 | Latest  | Cloud-based native builds                    |
| **Testing**          | Jest + RNTL + Maestro     | Latest  | Unit, integration, and E2E testing           |
| **Linting**          | ESLint + Prettier         | Latest  | Code quality and formatting                  |

**Migration Status:** All native modules (WatermelonDB, MMKV, Victory Native) migrated in Phase 0.5.B (Tasks 0.5.20-0.5.26).

### AI-Assisted Development Tools

**MCP Servers (Model Context Protocol):**

| Server                  | Tokens | Scope   | Purpose                                            |
| ----------------------- | ------ | ------- | -------------------------------------------------- |
| **Supabase**            | 13.7k  | Project | Database management, migrations, SQL queries, logs |
| **Sentry**              | 6k     | Project | Error monitoring and investigation (Phase 5+)      |
| **Maestro**             | 4k     | Project | E2E test generation and execution (Phase 3+)       |
| **Context7**            | 1.8k   | Global  | Library documentation lookup                       |
| **Filesystem**          | 9.4k   | Global  | File operations (read, write, edit, search)        |
| **Sequential Thinking** | 1.6k   | Global  | Complex problem analysis                           |

**CLI Tools:**

| Tool             | Installation              | Usage          | Purpose                    |
| ---------------- | ------------------------- | -------------- | -------------------------- |
| **Supabase CLI** | Local (devDep v2.58.5)    | `npx supabase` | Migrations, SQL, local dev |
| **Maestro CLI**  | Global (required for MCP) | `maestro`      | E2E testing (Phase 3+)     |
| **EAS CLI**      | Global                    | `eas`          | Native builds, submissions |

**See:** [.claude/CLAUDE.md](.claude/CLAUDE.md) for quick command reference.

---

## Architecture Overview

### Philosophy

- **Mobile-First:** Optimized for mobile experience
- **Offline-First:** Works without internet connection (CRITICAL)
- **Performance-First:** <2s cold start, 60fps animations
- **Type-Safe:** TypeScript strict mode throughout
- **Simple & Pragmatic:** Choose simplicity over complexity

### Key Decision: WatermelonDB + Supabase Sync

**Why WatermelonDB from Day 1:**

- ✅ **Production-Ready Architecture** - No costly migration later
- ✅ **Offline-First** - CRITICAL priority from PRD
- ✅ **Reactive Queries** - Auto-update UI on data changes
- ✅ **Performance** - Optimized for 2000+ workouts
- ✅ **Built-in Sync** - Robust conflict resolution vs manual sync

### Storage Stack

```
┌─────────────────────────────────────────┐
│         USER ACTIONS (UI)               │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│    ZUSTAND (temporary UI state)         │
│    - Active workout, form inputs        │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│    WATERMELONDB (offline-first)         │
│    - Workouts, exercises, sets          │
│    - Reactive queries, instant save     │
│    - Built-in sync protocol             │
└─────────────┬───────────────────────────┘
              │
              ▼ (automatic sync)
┌─────────────────────────────────────────┐
│    SUPABASE (cloud backup)              │
│    - PostgreSQL + Row Level Security    │
│    - Conflict: smart merge resolution   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│    MMKV (preferences + tokens)          │
│    - Auth tokens, user settings         │
│    - Encrypted, 10-30x faster           │
└─────────────────────────────────────────┘
```

---

## Architecture Decisions (ADRs)

<details>
<summary><strong>ADR Index (15 decisions)</strong></summary>

**Platform**
| ADR | Decision |
|-----|----------|
| [ADR-001](#adr-001-expo-sdk-54--development-build) | Expo SDK 54 + Development Build |
| [ADR-002](#adr-002-three-tier-testing-strategy) | Three-Tier Testing Strategy |

**Data Layer**
| ADR | Decision |
|-----|----------|
| [ADR-003](#adr-003-watermelondb-offline-first) | WatermelonDB Offline-First |
| [ADR-004](#adr-004-mmkv-encrypted-storage) | MMKV Encrypted Storage |
| [ADR-005](#adr-005-supabase-backend) | Supabase Backend |
| [ADR-006](#adr-006-rest-api-strategy) | REST API Strategy |

**UI Layer**
| ADR | Decision |
|-----|----------|
| [ADR-007](#adr-007-nativewind-v4-styling) | NativeWind v4 Styling |
| [ADR-008](#adr-008-react-native-reusables) | React Native Reusables |
| [ADR-009](#adr-009-single-dark-mode) | Single Dark Mode |
| [ADR-010](#adr-010-expo-vector-icons) | Expo Vector Icons |

**Performance**
| ADR | Decision |
|-----|----------|
| [ADR-011](#adr-011-flashlist) | FlashList for Lists |
| [ADR-012](#adr-012-expo-image) | expo-image Caching |
| [ADR-013](#adr-013-victory-native) | Victory Native Charts |

**State & Content**
| ADR | Decision |
|-----|----------|
| [ADR-014](#adr-014-zustand-state-management) | Zustand State Management |
| [ADR-015](#adr-015-exercisedb-dataset) | ExerciseDB Dataset |

</details>

---

### ADR-001: Expo SDK 54 + Development Build

**Decision:** Expo SDK 54 with EAS Development Build from Day 1

**Rationale:**

- Expo managed workflow for rapid MVP development
- Development Build enables native modules (WatermelonDB, MMKV, Victory Native)
- Avoids costly Expo Go → Dev Build migration later
- Hot reload works normally; only rebuild for native module changes

**Trade-offs:** 3-4h initial setup vs 5min Expo Go, but saves weeks of migration later

**Status:** Implemented

---

### ADR-002: Three-Tier Testing Strategy

**Decision:** Jest (Unit) + Manual E2E (Phase 1) + Maestro (Phase 3+)

**Rationale:**

- Jest + LokiJS for fast unit tests (CRUD/queries)
- Manual E2E to validate sync protocol before automation
- Maestro for automated critical flows (Phase 3+)

**Limitation:** WatermelonDB sync requires real SQLite (cannot test in Jest)

**Reference:** [TESTING.md](./TESTING.md)

**Status:** Implemented

---

### ADR-003: WatermelonDB Offline-First

**Decision:** WatermelonDB with Supabase sync

**Rationale:**

- Offline-first is critical (PRD priority)
- Reactive queries with `.observe()` for auto-updating UI
- Built-in sync protocol with automatic conflict resolution
- Optimized for scale (2000+ workouts)

**Implementation:** `src/models/`, `src/services/database/watermelon/`

**Trade-offs:** Requires Development Build

**Status:** Implemented

---

### ADR-004: MMKV Encrypted Storage

**Decision:** MMKV for key-value storage (auth tokens, preferences)

**Rationale:**

- 10-30x faster than AsyncStorage
- Native encryption (secure by default)
- Synchronous API (instant reads)

**Implementation:** `src/services/storage/mmkvStorage.ts`

**Trade-offs:** Requires Development Build, key-value only

**Status:** Implemented

---

### ADR-005: Supabase Backend

**Decision:** Supabase for auth, database, storage, real-time

**Rationale:** No backend code needed, Row Level Security, generous free tier (500MB DB, 50K MAU)

**Trade-offs:** Vendor lock-in (mitigated: PostgreSQL is portable)

**Status:** Implemented

---

### ADR-006: REST API Strategy

**Decision:** REST API via `supabase-js` client

**Rationale:**

- Native Supabase support (`supabase.rpc()` for sync)
- Simpler than GraphQL (no schema/resolvers)
- WatermelonDB sync uses simple pull/push RPC calls

**Implementation:** [src/services/database/remote/sync.ts](../src/services/database/remote/sync.ts)

**Trade-offs:** Possible overfetching vs GraphQL (acceptable for mobile)

**Status:** Implemented

---

### ADR-007: NativeWind v4 Styling

**Decision:** NativeWind v4 (Tailwind CSS for React Native)

**Rationale:**

- Utility-first CSS for faster development
- Industry standard with extensive documentation
- Better maintainability than StyleSheet.create

**Trade-offs:** +50KB bundle size

**Status:** Implemented

---

### ADR-008: React Native Reusables

**Decision:** React Native Reusables (shadcn/ui port) as component library

**Rationale:**

- Pre-built accessible components (Button, Input, Card, Form)
- Built with NativeWind v4 (already in stack)
- Source code in project (full customization)
- Class Variance Authority for type-safe variants

**Trade-offs:** +50KB bundle, shadcn/ui learning curve

**Status:** Implemented

---

### ADR-009: Single Dark Mode

**Decision:** Dark mode only (no light mode toggle)

**Rationale:**

- Gym usage in low-light environments
- Simpler implementation (no theme switching)
- Better battery life on OLED screens

**Design Tokens:** See `tailwind.config.ts` (#0A0A0A background, #00E5FF primary)

**Trade-offs:** No light mode option

**Status:** Implemented

---

### ADR-010: Expo Vector Icons

**Decision:** @expo/vector-icons for iconography

**Rationale:**

- 10,000+ icons (Material, Ionicons, FontAwesome)
- Included by default in Expo SDK
- Native font rendering (better than SVG)

**Trade-offs:** ~500KB for all packs (can optimize)

**Status:** Implemented

---

### ADR-011: FlashList

**Decision:** FlashList for all lists (exercise library, workout history)

**Rationale:**

- 54% FPS improvement, 82% CPU reduction vs FlatList
- Cell recycling (10x faster virtualization)
- Critical for 500+ exercise library on low-end devices

**Trade-offs:** +50KB bundle, requires `estimatedItemSize` prop

**Status:** Implemented

---

### ADR-012: expo-image

**Decision:** CachedImage wrapper around expo-image

**Rationale:**

- Exercise GIFs must load <200ms (PRD requirement)
- Built-in memory + disk cache
- 10-30x faster than React Native Image

**Implementation:** `src/components/ui/CachedImage.tsx`

**Trade-offs:** +100KB bundle

**Status:** Implemented

---

### ADR-013: Victory Native

**Decision:** Victory Native v41 (Skia-based) for charts

**Rationale:**

- 60fps with 1000+ data points
- Advanced gestures (zoom, pan, crosshairs)
- Fully themeable with dark mode

**Implementation:** `src/components/charts/`

**Trade-offs:** Requires Development Build, +200KB bundle

**Status:** Implemented

---

### ADR-014: Zustand State Management

**Decision:** Zustand for global state (auth, workout session)

**Rationale:**

- Minimal (~1KB vs Redux 20KB)
- Excellent TypeScript support
- Sufficient for MVP scope

**Trade-offs:** Smaller ecosystem than Redux

**Status:** Implemented

---

### ADR-015: ExerciseDB Dataset

**Decision:** Seed from GitHub ExerciseDB dataset (1,500+ exercises)

**Rationale:**

- Professional GIFs, instructions, categorization
- One-time seed to Supabase, local queries at runtime

**Trade-offs:** License compliance required

**Status:** Implemented

---

## Project Structure

See [ARCHITECTURE.md § Structure Détaillée](./ARCHITECTURE.md#-structure-détaillée) for complete folder organization.

---

## Design System

See `tailwind.config.ts` for complete theme configuration (colors, spacing, typography).

**Quick reference**: Dark theme, 8px spacing grid, NativeWind v4 (Tailwind CSS 3.4)

---

## Database Schema

See [DATABASE.md](./DATABASE.md) for complete schema documentation (WatermelonDB + Supabase sync).

---

## Security & Monitoring

### Authentication & Data Protection

**Authentication:**

- Supabase Auth (JWT tokens, auto-refresh)
- MMKV encrypted storage (tokens, session data)
- Future: Biometric (Face ID/Touch ID)

**Security Layers:**

| Layer        | Implementation                               | Protection                                         |
| ------------ | -------------------------------------------- | -------------------------------------------------- |
| **Database** | RLS policies                                 | Users see only their data (`auth.uid() = user_id`) |
| **Local**    | MMKV encrypted (native), WatermelonDB SQLite | Tokens encrypted, data isolated per user           |
| **Network**  | HTTPS (TLS 1.3)                              | Future: Certificate pinning                        |

**Row Level Security Example:**

```sql
CREATE POLICY "Users see own workouts"
  ON workouts FOR ALL
  USING (auth.uid() = user_id);
```

**Best Practices:**

- Environment variables for API keys (`.env` not committed)
- Client + server input validation
- No passwords/PII in logs

---

### Error Monitoring & Performance Tracking

**Sentry Setup (Production-Only):**

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 1.0, // 100% performance monitoring
  beforeSend: (event) => ({
    ...event,
    user: { id: user.id }, // No PII
  }),
});
```

**Monitoring Thresholds:**

| Metric        | Threshold | Action            |
| ------------- | --------- | ----------------- |
| Crash rate    | >0.5%     | Hotfix            |
| ANR (Android) | >1%       | Performance audit |
| API errors    | >5%       | Check Supabase    |
| Slow queries  | >2s       | Add indexes       |
| Cold start    | >3s       | Optimize init     |

**Free Tiers:**

- Sentry: 5,000 errors/month
- PostHog: 1M events/month

---

### Compliance & Privacy

**App Store Requirements (MVP):**

| Requirement      | Implementation                                          |
| ---------------- | ------------------------------------------------------- |
| Privacy Policy   | Data collection disclosure (workouts, email, analytics) |
| Terms of Service | Liability disclaimers (not medical advice)              |
| Data Deletion    | Cascade delete (Supabase → WatermelonDB → MMKV)         |
| Data Export      | JSON export (GDPR compliance)                           |
| Privacy Manifest | iOS 17+ declarations                                    |
| Age Rating       | 4+ (fitness app)                                        |

**Data Deletion Flow:**

```typescript
async function deleteUserAccount() {
  await supabase.auth.admin.deleteUser(userId); // Cascades via foreign keys
  await database.write(async () => await database.unsafeResetDatabase()); // WatermelonDB
  storage.clearAll(); // MMKV
}
```

**Data Export (GDPR):**

```typescript
// Export all user data as JSON
return JSON.stringify({ user, workouts, exercises, exported_at });
```

---

## Performance Guidelines

### Bundle Size

- **Target:** <10MB initial bundle
- Use code splitting for large features
- Lazy load heavy components
- Remove unused dependencies
- **Monitor:** Use `npx react-native-bundle-visualizer` regularly

### Cold Start

- **Target:** <2 seconds
- **Strategy:**
  - WatermelonDB lazy loading (nothing loaded until requested)
  - Defer ExerciseDB initial sync to background
  - Use skeleton screens for workout history
  - MMKV for instant settings/preferences load

### Runtime Performance

#### Lists (Critical)

- **FlashList only** (54% FPS improvement, 82% CPU reduction, prevents OOM crashes)
- Required prop: `estimatedItemSize={80}`

#### Images (500+ GIFs)

- **expo-image** with `cachePolicy="memory-disk"`
- Lazy load + pre-cache favorites

#### Database Queries

- **WatermelonDB:** `.observe()` for reactive queries, `.take(20)` for pagination, batch inserts
- **Supabase:** RLS policies optimized, indexes on `user_id`

#### Animations

- **Target:** 60fps consistently
- Use `react-native-reanimated` (already installed)
- Run animations on UI thread (not JS thread)
- Avoid inline functions in render
- Memoize expensive calculations
- Use `React.memo` for expensive components

#### Specific Performance Targets

| Operation                  | Target Time | Strategy                                   |
| -------------------------- | ----------- | ------------------------------------------ |
| App Launch                 | <2s         | WatermelonDB lazy load, MMKV instant prefs |
| Exercise Search            | <100ms      | FlashList + local indexes                  |
| Workout Save               | <50ms       | WatermelonDB batch insert                  |
| Chart Render (1000 points) | <500ms      | Victory Native + memoization               |
| Image Load                 | <200ms      | expo-image cache + pre-fetch               |

---

## Coding Standards

**TypeScript:** Strict mode, explicit return types, interfaces > types, no `any`, explicit null checks

**React:** Functional components, TypeScript props interfaces, named exports, <200 lines

**Styling:** StyleSheet.create(), theme values (Colors, Spacing), no inline styles

## Development Workflow

See [CONTRIBUTING.md](./CONTRIBUTING.md) for complete workflow (commit conventions, branches, review process).

---

## Deployment

**Current:** Development Build (EAS Build) - Required for native modules (WatermelonDB, MMKV, Victory Native)

**Distribution:** TestFlight (iOS) / Play Store Internal Testing (Android)

See [DEVOPS_PIPELINE.md](./DEVOPS_PIPELINE.md) for build configuration and CI/CD details.

---

## UX Best Practices

### Core Patterns

| Feature              | Anti-Pattern                      | Best Practice                                               |
| -------------------- | --------------------------------- | ----------------------------------------------------------- |
| **Set Logging**      | 7 taps (modals, confirmations)    | 1-2 taps (auto-fill last, inline edit, quick +/- buttons)   |
| **Plate Calculator** | Manual math                       | Button next to weight → "Add per side: 20kg + 10kg + 2.5kg" |
| **Rest Timer**       | Stops when minimized              | Background + push notification + auto-start from history    |
| **RIR Tracking**     | Prompt after every set (annoying) | End-of-workout summary OR optional inline button            |
| **Exercise Search**  | Search button + pagination        | Real-time filter (FlashList 500+ exercises, 300ms debounce) |
| **Workout Start**    | Empty only                        | MVP: Empty + Repeat Last; Phase 2: Templates + Resume       |

### Mobile-Specific

**Gym Environment:**

- Large tap targets (44x44pt minimum) - gloves, sweaty hands
- High contrast - bright lighting
- Landscape support - phone on bench
- One-handed mode

**Data Reliability:**

- Never show "No internet" errors during workout
- Instant save confirmation (local-first)
- Subtle sync indicator when online
- Conflict resolution: Last write wins

**Error Messages (Contextual):**

```typescript
❌ "Network request failed" → ✅ "Saved locally. Will sync when online."
❌ "Invalid input" → ✅ "Weight must be between 0-500kg"
❌ "Error 500" → ✅ "Couldn't load history. Try again?"
```

---

## Resources

**Docs:** [Expo](https://docs.expo.dev/) | [React Native](https://reactnative.dev/) | [Supabase](https://supabase.com/docs) | [WatermelonDB](https://nozbe.github.io/WatermelonDB/) | [MMKV](https://github.com/mrousavy/react-native-mmkv) | [Zustand](https://docs.pmnd.rs/zustand) | [FlashList](https://shopify.github.io/flash-list/) | [Victory Native](https://commerce.nearform.com/open-source/victory-native/)

**APIs:** [ExerciseDB](https://v2.exercisedb.io/docs) | [Sentry](https://docs.sentry.io/platforms/react-native/) | [RevenueCat](https://www.revenuecat.com/docs)

**Tools:** [RN Directory](https://reactnative.directory/) | [Bundle Visualizer](https://www.npmjs.com/package/react-native-bundle-visualizer) | [simple-statistics](https://simplestatistics.org/)

**Inspiration:** Strong, Hevy, JEFIT

---

**Last Updated:** November 2025 (MVP scope refinement: 79 tasks, Post-MVP analytics)
