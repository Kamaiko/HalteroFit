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

</div>

## About

Fitness platform: mobile app for workout logging, web app for AI coaching and analytics. 1,300+ exercise library, custom training plans, fast set logging. Offline-first, syncs to cloud when connected.

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
- **Offline-first** — syncs to cloud when connected
- **Dark mode** optimized for gym environments
- **Fast set logging** — 1–2 taps per set

---

## Architecture Overview

Halterofit is a pnpm + Turborepo monorepo:

| App           | Stack                                                   | Status                     |
| ------------- | ------------------------------------------------------- | -------------------------- |
| `apps/mobile` | React Native + Expo SDK 54, WatermelonDB, NativeWind v4 | Phase 2 — Plans & Routines |
| `apps/web`    | Next.js 16, Tailwind v4, Vercel AI SDK, pgvector        | Planned                    |

The mobile app is offline-first — all data is stored on device via [WatermelonDB](https://watermelondb.dev) and syncs to [Supabase](https://supabase.com) when connected. The web app will provide an AI coach with RAG and analytics dashboard.

For the full architecture — folder structure, data flow, and design patterns — see [docs/reference/ARCHITECTURE.md](docs/reference/ARCHITECTURE.md).

---

## Quick Start

```bash
pnpm install
cd apps/mobile
cp .env.example .env.local    # fill in Supabase credentials
pnpm start
```

The mobile app requires an [Expo Development Build](https://docs.expo.dev/develop/development-builds/introduction/) — it cannot run in Expo Go due to native modules (WatermelonDB, MMKV).

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

## Project Status

**Mobile app — Phase 2: Plans & Routines** (in progress). Phase 1 (Exercise Library) is complete.

**Web app** — planned. See [docs/product/HALTEROFIT-WEB.md](docs/product/HALTEROFIT-WEB.md) for the full planning document.

See [docs/TASKS.md](docs/TASKS.md) for the full kanban board and phase roadmap.
