# Contributing

This guide covers project setup, development workflow, coding standards, and common troubleshooting steps for contributing to Halterofit.

## Table of Contents

- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
- [Pre-Commit Checklist](#pre-commit-checklist)
- [Documentation](#documentation)
- [Coding Standards](#coding-standards)
- [Common Issues](#common-issues)
- [Commands](#commands)
- [CI/CD Architecture](#cicd-architecture)

## Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Expo account** (free tier) - [Sign up here](https://expo.dev/signup)
- **Supabase account** (free tier) - [Sign up here](https://supabase.com/dashboard/sign-up)
- **EAS CLI** for building development builds
- **Git** ([Download](https://git-scm.com/))

### Setup (First Time - ~15-20 minutes)

1. **Clone and install**

   ```bash
   git clone https://github.com/Kamaiko/HalteroFit.git
   cd HalteroFit
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env and add your Supabase credentials:
   # Find these in Supabase Dashboard → Settings → API:
   # - URL: Copy "Project URL"
   # - Anon Key: Copy "anon public" key
   # EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   # EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Install EAS CLI and login**

   ```bash
   npm install -g eas-cli
   eas login
   ```

4. **Build Development Build (one-time, ~15-20 minutes)**

   ```bash
   # For Android
   eas build --profile development --platform android

   # For iOS (requires macOS)
   eas build --profile development --platform ios

   # Wait for build to complete and scan QR code to install on your device
   ```

5. **Start development server**
   ```bash
   npm start
   # Scan QR code with your installed development build app
   ```

**Note**: We use Development Build (not Expo Go) because the project requires native modules (WatermelonDB, MMKV, Victory Native).

---

## Development Workflow

### Daily Development (after initial setup)

Once you have the dev build installed, daily development works as expected with hot reload.

```bash
npm start
# Scan QR code with your dev build app
# Hot reload works normally
```

**When do you need to rebuild?**

You need to rebuild the development build when:

- Adding npm packages that require native code (e.g., react-native-_, expo-_)
- Modifying native configuration in app.json
- Updating Expo SDK version
- Changing native module settings

To rebuild: `eas build --profile development --platform [android|ios]`

### 1. Pick a Task

- Check [TASKS.md](TASKS.md) for the next priority
- Start with "Current Focus" tasks

### 2. Create a Branch

```bash
git checkout -b feature/task-description
# or
git checkout -b fix/bug-description
```

### 3. Make Changes

- Follow [ARCHITECTURE.md](ARCHITECTURE.md) folder structure
- Follow [TECHNICAL.md](TECHNICAL.md) coding standards
- Test on a real device
- Use theme values (colors, spacing, typography)

### 4. Commit

Follow the commit message convention:

```bash
# Format: <type>(<scope>): <description>
git commit -m "feat(auth): add login screen UI"
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**

```bash
feat(workout): add RPE tracking to set logger
fix(analytics): correct volume calculation for compound exercises
docs(readme): update installation instructions
style(components): format workout card component
refactor(lib): extract 1RM calculations to separate module
test(workout): add unit tests for set validation
chore(deps): update React Native to 0.82.0
```

### 5. Push and PR

```bash
git push origin feature/task-description
```

---

## Pre-Commit Checklist

- [ ] App builds without errors (`npm start`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Tests pass (`npm test`)
- [ ] Database schema version incremented (if schema changed)
- [ ] No console.log statements (see TECHNICAL.md § Logging)
- [ ] Uses theme values from DESIGN_SYSTEM.md (no hardcoded colors/spacing)
- [ ] Tested on real device (Android or iOS)
- [ ] Commit message follows convention
- [ ] No sensitive data in code (API keys, credentials)

---

## Documentation

See [README.md § Documentation](../README.md#-documentation) for complete documentation index.

---

## Coding Standards

**See [TECHNICAL.md](TECHNICAL.md) for complete coding standards.**

### Key Rules

- TypeScript strict mode (no `any`)
- Use absolute imports (`@/components` instead of `../../../components`)
- Barrel exports (re-exporting from `index.ts` files) for cleaner import paths
- Use NativeWind (Tailwind CSS) for styling
- Functional components only
- WatermelonDB for database operations
- MMKV for encrypted storage
- No hardcoded colors/spacing (use theme)
- No inline styles (use NativeWind classes)
- No `console.log` in production code

### Folder Structure

```
src/
├── app/              # Expo Router screens & navigation
├── components/       # Reusable UI components (feature-organized)
├── hooks/            # Custom React hooks
├── services/         # Business logic & external services
│   ├── database/     # WatermelonDB setup & operations
│   ├── storage/      # MMKV storage wrapper
│   └── supabase/     # Supabase client
├── stores/           # Zustand global state
├── types/            # Shared TypeScript types
├── utils/            # Pure utility functions
└── constants/        # App-wide constants
```

**See [ARCHITECTURE.md](ARCHITECTURE.md) for complete structure.**

---

## Common Issues

**For comprehensive troubleshooting**, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Critical Path Issues (First-Time Setup)

**"Cannot install development build"**

- Check that build completed successfully in EAS dashboard
- Re-download build from EAS dashboard
- Uninstall existing version first

**"Native module not found"**

- You need to rebuild dev build: `eas build --profile development --platform [android|ios]`
- Wait for build and install new version

**"Hot reload not working"**

- Press `r` in Metro console to reload
- Or shake device → "Reload"

**For database, TypeScript, Metro, storage, and other issues:** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## Commands

### Daily Development

```bash
npm start              # Start dev server
npm start -- --clear   # Clear cache & start
npm run type-check     # TypeScript validation
```

### Building (only when adding native modules)

```bash
# Development Build
eas build --profile development --platform android
eas build --profile development --platform ios

# Preview Build (for testing)
eas build --profile preview --platform android

# Production Build (for release)
eas build --profile production --platform android
eas build --profile production --platform ios
```

### Testing

```bash
npm test              # Run unit tests
npm run type-check    # TypeScript validation
```

### Database Schema Check

```bash
# Start Metro bundler
npm start

# Open debugger (press 'j' in Metro console or shake device → Debug Remote JS)
# In browser console, paste:
import { database } from './src/services/database/watermelon';
await database.adapter.getLocal('schema_version');
```

### Database Schema Changes

**When modifying the database schema, follow this 6-step checklist:**

This process ensures Supabase (PostgreSQL) and WatermelonDB (SQLite) schemas stay in sync.

**Checklist:**

1. **Create Supabase migration**

   ```bash
   supabase migration new add_my_field
   ```

2. **Edit migration SQL file**
   - File: `supabase/migrations/<timestamp>_add_my_field.sql`
   - Add column, index, constraint, etc.

3. **Apply migration to Supabase**
   - Via SQL Editor: Copy-paste SQL
   - Or via CLI: `supabase db push`

4. **Update WatermelonDB schema**
   - File: `src/services/database/watermelon/schema.ts`
   - Add column to appropriate table
   - Match data types: TEXT → 'string', BIGINT → 'number', JSONB → 'string'

5. **Increment schema version**

   ```typescript
   // schema.ts
   export const schema = appSchema({
     version: 2, // Increment from 1 to 2
     // ...
   });
   ```

   - **Warning:** Pre-commit hook will block commit if you forget this step!

6. **Create WatermelonDB migration** (if users have existing data)
   - File: `src/services/database/watermelon/migrations.ts`
   - Use `addColumns()` to add new fields
   - See [WatermelonDB Migrations](https://nozbe.github.io/WatermelonDB/Advanced/Migrations.html)

**Example:**

```typescript
// 1. Supabase migration (SQL)
ALTER TABLE public.exercises ADD COLUMN difficulty TEXT;

// 2. WatermelonDB schema (TypeScript)
tableSchema({
  name: 'exercises',
  columns: [
    // ... existing columns
    { name: 'difficulty', type: 'string', isOptional: true },
  ],
}),

// 3. Increment version
version: 2,

// 4. WatermelonDB migration (if needed)
schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'exercises',
          columns: [{ name: 'difficulty', type: 'string', isOptional: true }],
        }),
      ],
    },
  ],
})
```

**Resources:**

- [DATABASE.md](DATABASE.md) - Complete schema documentation
- [WatermelonDB Migrations Guide](https://nozbe.github.io/WatermelonDB/Advanced/Migrations.html)

---

## CI/CD Architecture

**For complete CI/CD documentation**, see [DEVOPS_PIPELINE.md](DEVOPS_PIPELINE.md)

**Git Hooks:**

- **Pre-commit**: Auto-formats staged files with Prettier
- **Pre-push**: Runs type-check, lint, and tests

**Local Pre-Push Checks** (run these before pushing):

| Command              | Purpose                      |
| -------------------- | ---------------------------- |
| `npm run type-check` | TypeScript validation        |
| `npm run lint`       | Auto-fix linting issues      |
| `npm test`           | Run unit tests               |
| `npm audit`          | Security vulnerability check |

**CI Jobs:** Lint, Test, Security (parallel) → Auto-Merge

---

**Happy Coding!**

**Tech Stack & Architecture**: See [README.md](../README.md#️-tech-stack) for complete stack details.
