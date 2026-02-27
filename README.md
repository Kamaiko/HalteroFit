<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/branding/icon.svg" />
  <source media="(prefers-color-scheme: light)" srcset="assets/branding/icon-dark.svg" />
  <img src="assets/branding/icon-dark.svg" alt="Halterofit icon" width="130" />
</picture>

<br/>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/branding/wordmark.png" />
  <source media="(prefers-color-scheme: light)" srcset="assets/branding/wordmark-dark.png" />
  <img src="assets/branding/wordmark-dark.png" alt="Halterofit" width="360" />
</picture>

**Track your sets. Follow your plan. See your progress.**

<!-- Tech Stack -->

[![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-20232a?style=flat&logo=react&logoColor=61DAFB)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![NativeWind](https://img.shields.io/badge/NativeWind-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://nativewind.dev)

<!-- Backend & Storage -->

[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![WatermelonDB](https://img.shields.io/badge/🍉_WatermelonDB-00D9C0?style=flat)](https://watermelondb.dev)
[![MMKV](https://img.shields.io/badge/MMKV-F59E0B?style=flat)](https://github.com/mrousavy/react-native-mmkv)
[![Zustand](https://img.shields.io/badge/Zustand-black?style=flat)](https://zustand-demo.pmnd.rs)

<!-- Dev Tools -->

[![Sentry](https://img.shields.io/badge/Sentry-362D59?style=flat&logo=sentry&logoColor=white)](https://sentry.io)
[![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)](https://jestjs.io)
[![Maestro](https://img.shields.io/badge/Maestro-6C47FF?style=flat)](https://maestro.mobile.dev)

<br/>

</div>

## About

Comprehensive workout tracker with a 1,300+ exercise library, customizable training plans, and fast set logging. Built for lifters who want to track everything without friction.

---

<details>
<summary><strong>Screenshots</strong></summary>
<br/>

<!-- TODO: Add app screenshots -->

_Screenshots coming soon — app is in active development (Phase 2)._

</details>

---

## Key Features

- **1,300+ exercises** with animated GIF demonstrations
- **Custom workout plans** with day-by-day programming
- **Offline-first** — works without internet, syncs when connected
- **Dark mode** optimized for gym environments
- **Fast set logging** — 1–2 taps per set

---

## Architecture Overview

Halterofit is built with React Native + Expo SDK 54. [WatermelonDB](https://watermelondb.dev) powers the offline-first local database — all data is stored on device first and syncs to [Supabase](https://supabase.com) when a connection is available. Styling is handled by [NativeWind v4](https://nativewind.dev) (Tailwind CSS for React Native).

For the full architecture — folder structure, data flow, and design patterns — see [docs/reference/ARCHITECTURE.md](docs/reference/ARCHITECTURE.md).

---

## Quick Start

```bash
npm install
cp .env.example .env.local
npm start
```

Fill in your Supabase credentials in `.env.local` before starting. The app requires an [Expo Development Build](https://docs.expo.dev/develop/development-builds/introduction/) — it cannot run in Expo Go due to native modules (WatermelonDB, MMKV).

For detailed setup including development builds, environment variables, and first-run troubleshooting, see [docs/getting-started/SETUP.md](docs/getting-started/SETUP.md).

---

## Documentation

All project documentation lives in [`docs/`](docs/README.md), organized by the [Diataxis framework](https://diataxis.fr/).

| Start with                                        | When you need to                  |
| ------------------------------------------------- | --------------------------------- |
| [Setup Guide](docs/getting-started/SETUP.md)      | Get the project running           |
| [Architecture](docs/reference/ARCHITECTURE.md)    | Understand the codebase structure |
| [ADRs](docs/decisions/README.md)                  | Learn why decisions were made     |
| [Testing](docs/guides/TESTING.md)                 | Write or run tests                |
| [Troubleshooting](docs/guides/TROUBLESHOOTING.md) | Fix a broken environment          |

---

## Tech Decisions

All major architectural decisions are documented as Architecture Decision Records (ADRs) in [`docs/decisions/`](docs/decisions/README.md). There are 20 ADRs covering platform, data, UI, performance, state, and monitoring choices.

A few highlights:

- **[ADR-003](docs/decisions/003-watermelondb-offline-first.md)** — Why WatermelonDB for offline-first data (over AsyncStorage, SQLite, or Realm)
- **[ADR-009](docs/decisions/009-single-dark-mode.md)** — Why the app ships dark mode only (no light/dark toggle)
- **[ADR-002](docs/decisions/002-three-tier-testing.md)** — The three-tier testing strategy (Jest + WatermelonDB adapter + Maestro E2E)

---

## Project Status

**Current phase: Phase 2 — Plans & Routines** (in progress)

Phase 1 (Exercise Library) is complete. Active work is on workout plan creation, day management, and plan card components.

See [docs/TASKS.md](docs/TASKS.md) for the full kanban board and phase roadmap.
