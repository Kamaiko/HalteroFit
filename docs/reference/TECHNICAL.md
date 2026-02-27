# Technical

Technology stack, security posture, performance guidelines, and coding standards. For architecture decisions, see [decisions/](../decisions/README.md).

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Architecture Decisions](#architecture-decisions)
3. [Security & Monitoring](#security--monitoring)
4. [Performance Guidelines](#performance-guidelines)
5. [Coding Standards](#coding-standards)
6. [Resources](#resources)

---

## Technology Stack

**Current Production Stack (Development Build):**

| Category             | Technology                | Version   | Purpose                                      |
| -------------------- | ------------------------- | --------- | -------------------------------------------- |
| **Framework**        | Expo SDK                  | 54        | React Native framework with managed workflow |
| **Language**         | TypeScript                | 5         | Type-safe development                        |
| **UI Library**       | React Native              | 0.81      | Mobile UI framework                          |
| **Styling**          | NativeWind                | 4         | Tailwind CSS for React Native                |
| **UI Components**    | React Native Reusables    | Latest    | shadcn/ui for React Native                   |
| **Icons**            | React Native Vector Icons | Latest    | 10,000+ icons (Material, Ionicons, FA)       |
| **Database**         | WatermelonDB              | 0.28      | Offline-first reactive database              |
| **Storage**          | MMKV                      | 4         | Encrypted key-value storage                  |
| **State Management** | Zustand                   | 5         | Lightweight global state                     |
| **Validation**       | Zod                       | (planned) | Schema validation and type inference         |
| **Backend**          | Supabase                  | 2         | PostgreSQL + Auth + Storage                  |
| **Charts**           | Victory Native            | 41        | Data visualization (Skia-based)              |
| **Lists**            | FlashList                 | 2         | High-performance lists                       |
| **Images**           | expo-image                | 3         | Optimized image loading with caching         |
| **Navigation**       | Expo Router               | 6         | File-based routing                           |
| **Error Monitoring** | Sentry                    | 7         | Crash reporting and monitoring               |
| **Build**            | EAS Build                 | Latest    | Cloud-based native builds                    |
| **Testing**          | Jest + RNTL + Maestro     | Latest    | Unit, integration, and E2E testing           |
| **Linting**          | ESLint + Prettier         | Latest    | Code quality and formatting                  |
| **CI/CD**            | GitHub Actions            | Latest    | Automated testing, linting, TruffleHog       |

_See `package.json` for exact versions. Major versions only listed here to avoid staleness._

### AI-Assisted Development Tools

**MCP Servers (Model Context Protocol):**

| Server                  | Status | Tokens | Scope   | Purpose                              |
| ----------------------- | ------ | ------ | ------- | ------------------------------------ |
| **Supabase**            | Active | 13.7k  | Project | Database management, migrations, SQL |
| **Sentry**              | Future | 6k     | Project | Error monitoring (Phase 5+)          |
| **Maestro**             | Future | 4k     | Project | E2E test generation (Phase 3+)       |
| **Context7**            | Active | 1.8k   | Global  | Library documentation lookup         |
| **Filesystem**          | Active | 9.4k   | Global  | File operations (read, write, edit)  |
| **Sequential Thinking** | Active | 1.6k   | Global  | Complex problem analysis             |

_Status: Active or Future Phase_

**CLI Tools:**

| Tool             | Installation              | Usage      | Purpose                    |
| ---------------- | ------------------------- | ---------- | -------------------------- |
| **Supabase CLI** | Global (scoop v2.62.10)   | `supabase` | Migrations, SQL, local dev |
| **Maestro CLI**  | Global (required for MCP) | `maestro`  | E2E testing (Phase 3+)     |
| **EAS CLI**      | Global                    | `eas`      | Native builds, submissions |

---

## Architecture Decisions

20 documented decisions covering platform, data layer, UI, performance, state management, and monitoring.

**Browse all ADRs:** [docs/decisions/](../decisions/README.md)

| Category        | Key Decisions                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Platform**    | Expo SDK 54 + Dev Build, Three-Tier Testing, TypeScript Strict, Expo Router, ESLint + Prettier, GitHub Actions CI/CD |
| **Data**        | WatermelonDB Offline-First, MMKV Encrypted Storage, Supabase Backend, REST API, ExerciseDB Dataset                   |
| **UI**          | NativeWind v4, React Native Reusables, Single Dark Mode, Expo Vector Icons                                           |
| **Performance** | FlashList, expo-image Caching, Victory Native Charts                                                                 |
| **State**       | Zustand                                                                                                              |
| **Monitoring**  | Sentry                                                                                                               |

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
- PostHog: 1M events/month _(planned — not yet installed)_

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

#### Profiling Tools

```bash
# Bundle analysis
npx react-native-bundle-visualizer

# React DevTools (component profiler)
npx react-devtools

# Flipper (SQLite inspector, network, layout)
# Install: https://fbflipper.com/
flipper

# Android memory profiling
adb shell dumpsys meminfo com.halterofit.app

# iOS Instruments (via Xcode)
# Product → Profile → Time Profiler / Allocations
```

---

## Coding Standards

**TypeScript:** Strict mode, explicit return types, interfaces > types, no `any`, explicit null checks

**React:** Functional components, TypeScript props interfaces, named exports, <200 lines

**Styling:** NativeWind v4 `className` (primary), `StyleSheet.create()` for exceptions, `Colors` constants for programmatic color refs

---

## Resources

**Docs:** [Expo](https://docs.expo.dev/) | [React Native](https://reactnative.dev/) | [Supabase](https://supabase.com/docs) | [WatermelonDB](https://nozbe.github.io/WatermelonDB/) | [MMKV](https://github.com/mrousavy/react-native-mmkv) | [Zustand](https://docs.pmnd.rs/zustand) | [FlashList](https://shopify.github.io/flash-list/) | [Victory Native](https://commerce.nearform.com/open-source/victory-native/)

**APIs:** [ExerciseDB](https://v2.exercisedb.io/docs) | [Sentry](https://docs.sentry.io/platforms/react-native/) | [RevenueCat](https://www.revenuecat.com/docs)

**Tools:** [RN Directory](https://reactnative.directory/) | [Bundle Visualizer](https://www.npmjs.com/package/react-native-bundle-visualizer) | [simple-statistics](https://simplestatistics.org/)

**Inspiration:** Strong, Hevy, JEFIT
