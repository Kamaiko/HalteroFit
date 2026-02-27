# Development Setup

This guide walks you through getting Halterofit running on your machine for the first time. Follow each section in order.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Clone & Install](#clone--install)
- [Environment Variables](#environment-variables)
- [Development Build](#development-build)
- [Running the App](#running-the-app)
- [Running Tests](#running-tests)
- [Git Hooks](#git-hooks)
- [IDE Setup](#ide-setup)
- [Common Issues](#common-issues)
- [Useful Commands](#useful-commands)

---

## Prerequisites

Install the following before cloning the repo:

| Tool                                                   | Version           | Purpose                     |
| ------------------------------------------------------ | ----------------- | --------------------------- |
| [Node.js](https://nodejs.org/)                         | 18+               | JavaScript runtime          |
| npm                                                    | Bundled with Node | Package management          |
| [EAS CLI](https://docs.expo.dev/eas/cli/)              | Latest            | Build and submit apps       |
| [Android Studio](https://developer.android.com/studio) | Latest            | Android emulator (optional) |
| [Xcode](https://developer.apple.com/xcode/)            | 15+ (macOS only)  | iOS simulator (optional)    |

Install EAS CLI globally:

```bash
npm install -g eas-cli
eas login
```

---

## Clone & Install

```bash
git clone https://github.com/your-org/halterofit.git
cd halterofit
npm install
```

### Dependency Tool — Why It Matters

This project uses two different tools for installing packages, and using the wrong one causes native module crashes that require a full EAS rebuild to fix.

| Tool               | Use for                                              |
| ------------------ | ---------------------------------------------------- |
| `npx expo install` | React Native, Expo, and any package with native code |
| `npm install`      | Pure JavaScript packages (e.g., `zod`, `lodash`)     |

**Examples:**

```bash
# Native code — use expo install
npx expo install expo-camera react-native-gesture-handler

# Pure JS — use npm install
npm install zod date-fns
```

When in doubt, use `npx expo install`. It pins the version to what the current Expo SDK expects.

---

## Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

Open `.env.local` and set each variable:

| Variable                        | Required | Description                                                                                                                   |
| ------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Yes      | Your Supabase project URL — found in Supabase Dashboard → Settings → API                                                      |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anonymous key — same location as URL                                                                                 |
| `EXPO_PUBLIC_SENTRY_DSN`        | No       | Sentry DSN for error monitoring. Disabled in development (`__DEV__ = true`). Get from sentry.io → Create React Native project |
| `EXERCISEDB_API_KEY`            | No       | RapidAPI key for ExerciseDB (not needed — current implementation uses the GitHub dataset directly)                            |

**Important:** Do not add quotes around values in `.env.local`:

```bash
# Wrong
EXPO_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"

# Right
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
```

After editing `.env.local`, restart Metro to pick up the changes.

---

## Development Build

### Why Expo Go Doesn't Work

Expo Go is a sandboxed app that only supports Expo's built-in SDK modules. Halterofit uses native modules — WatermelonDB and MMKV — that require native code compiled into the app binary. Expo Go cannot load these modules, and attempting to run the app through Expo Go will crash immediately.

You need an **Expo Development Build**: a custom version of the app with all native modules pre-compiled.

### Building for the First Time

Builds run on EAS servers and take 15–20 minutes. You only need to rebuild when native code changes (see [When to Rebuild](#when-to-rebuild)).

```bash
# Android
eas build --profile development --platform android

# iOS (macOS only)
eas build --profile development --platform ios
```

After the build completes, install it on your device or emulator:

- Scan the QR code from the EAS dashboard, or
- Download the `.apk` / `.ipa` directly from the EAS dashboard

Verify the installation: the app icon should show the Halterofit branding, and the app name should be "Halterofit (dev)". If you see the Expo Go logo, the wrong app opened.

### Skipping a Build

If a team member has already built a compatible dev build, you can download it directly from the EAS dashboard without building again.

### When to Rebuild

You need a new build when:

- Adding a package with native code (`react-native-*`, `expo-*`, `@nozbe/*`)
- Modifying native configuration in `app.json`
- Updating the Expo SDK version
- Changing native module settings

You do NOT need to rebuild for:

- TypeScript/JavaScript changes (hot reload handles these)
- Styling changes
- Database schema changes (unless adding a new native package)

---

## Running the App

Start the Metro bundler:

```bash
npm start
```

Then open the Halterofit dev build on your device or emulator and scan the QR code in the terminal, or press `a` to open on a connected Android emulator.

---

## Running Tests

```bash
# Run all Jest tests once
npm test

# Watch mode — re-runs tests on file changes
npm run test:watch

# Type checking (no test output — TypeScript errors only)
npm run type-check
```

**What the tests cover:** Jest runs unit and integration tests using LokiJS as an in-memory database adapter. Tests cover validators, service logic, error handling, and state management.

**What Jest cannot cover:** WatermelonDB's sync protocol (`_changed`, `_status` columns) requires a real SQLite instance. These behaviors are validated through Maestro E2E tests (Phase 3+). See [guides/TESTING.md](../guides/TESTING.md) for the full testing strategy.

---

## Git Hooks

Husky installs git hooks automatically when you run `npm install`. You do not need to configure anything manually.

### Pre-commit Hook

Every commit triggers two checks on staged files:

1. **Schema version check** (`check-schema-version.sh`) — If you staged a database migration file, it verifies that the schema version in `src/services/database/local/schema.ts` was also incremented. This prevents migrations from being committed without a matching version bump.

2. **lint-staged** — Runs ESLint and Prettier on staged `.ts`, `.tsx`, `.json`, `.md`, and `.html` files. Prettier rewrites files in place; ESLint errors block the commit.

If a commit is blocked by the schema check and the change does not actually affect the schema:

```bash
git commit --no-verify
```

For full CI/CD details — GitHub Actions jobs, Dependabot, branch protection rules — see [reference/PIPELINE.md](../reference/PIPELINE.md).

---

## IDE Setup

**Recommended editor:** Visual Studio Code

**Recommended extensions:**

| Extension                 | Publisher     | Purpose                                        |
| ------------------------- | ------------- | ---------------------------------------------- |
| ESLint                    | Microsoft     | Inline linting with project ESLint config      |
| Prettier - Code formatter | Prettier      | Auto-format on save                            |
| Tailwind CSS IntelliSense | Tailwind Labs | Autocomplete for NativeWind `className` values |
| TypeScript (built-in)     | Microsoft     | Type checking and IntelliSense                 |

Enable format on save in your VS Code settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

## Common Issues

See [guides/TROUBLESHOOTING.md](../guides/TROUBLESHOOTING.md) for detailed solutions. Common first-run problems:

- **App opens in Expo Go** — Development Build not installed. See [Development Build](#development-build).
- **App crashes on launch** — Stale dev client state. Run `adb shell pm clear com.halterofit.app`, then `npm start`.
- **"MMKV native module not found"** — Running in Expo Go. Install the Development Build.
- **Supabase "Invalid API key"** — Check `.env.local` for missing or quoted values, then restart Metro.
- **Metro won't start** — Run `npm start -- --clear` to clear the bundler cache.

---

## Useful Commands

| Command                                              | Description                                  |
| ---------------------------------------------------- | -------------------------------------------- |
| `npm start`                                          | Start Metro bundler                          |
| `npm start -- --clear`                               | Start Metro and clear cache                  |
| `npm test`                                           | Run Jest tests                               |
| `npm run test:watch`                                 | Jest in watch mode                           |
| `npm run type-check`                                 | TypeScript type check (no emit)              |
| `npm run lint`                                       | ESLint check                                 |
| `npm run format`                                     | Prettier format all files                    |
| `eas build --profile development --platform android` | Build Android dev build                      |
| `eas build --profile development --platform ios`     | Build iOS dev build                          |
| `npx expo install --fix`                             | Fix Expo SDK package version mismatches      |
| `adb shell pm clear com.halterofit.app`              | Clear Android app data (keeps app installed) |
