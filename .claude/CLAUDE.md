# Claude Instructions - Halterofit

> **Version**: 5.0 (document version, not app version)
> **Last Updated**: 2025-11-20
> **Purpose**: AI agent project briefing and development guide

---

## 🎯 What You're Building

**Halterofit** is a mobile fitness tracker built for anyone who takes their training seriously enough to track it.

**Core Reference:** The app is essentially very similar to Jefit. Use Jefit as the primary reference for workout tracking UX, navigation patterns, and core feature set.

**Core MVP Features:**

- Fast workout logging (1-2 taps per set)
- Guaranteed data reliability (saves instantly to device)
- Comprehensive exercise library (1,300+ exercises)
- Workout templates for consistency
- Complete workout history

**Key Differentiator:** Reliability first. Every set you log is saved instantly to local database, syncs to cloud when connection available. Works completely offline.

**Design Philosophy:** Simple, fast, reliable. Focus on solid execution of core workout tracking. Advanced analytics deferred to post-MVP (Phase 6+).

---

## 🚧 Current Phase & Next Steps

**Current Phase:** Phase 1 - Authentication & Foundation
**Status:** Active development
**Version:** 0.1.0

**Recently Completed:**

- ✅ Phase 0.5: Architecture & Foundation (WatermelonDB, MMKV, Testing)
- ✅ Phase 0.6: UI/UX Foundation (React Native Reusables, Icons, Cleanup)

**Reference:** See [TASKS.md](../docs/TASKS.md) for detailed roadmap and current priorities

---

## 🛠️ Tech Stack

**Production Stack (Development Build):**

| Category   | Technology                | Purpose                   |
| ---------- | ------------------------- | ------------------------- |
| Framework  | Expo SDK 54               | React Native framework    |
| Language   | TypeScript 5.9            | Type-safe development     |
| Database   | WatermelonDB              | Offline-first reactive DB |
| Cloud Sync | Supabase                  | PostgreSQL + Auth + RLS   |
| Storage    | MMKV                      | Encrypted local storage   |
| State      | Zustand                   | Global state management   |
| UI Library | React Native              | Mobile UI framework       |
| Styling    | NativeWind v4             | Tailwind for RN           |
| Components | React Native Reusables    | shadcn/ui for RN          |
| Icons      | React Native Vector Icons | Material/Ionicons/FA      |
| Charts     | Victory Native            | Skia-based charts         |
| Lists      | FlashList                 | Optimized scrolling       |
| Images     | expo-image                | Memory/disk caching       |
| Build      | EAS Development Build     | Native module support     |
| Testing    | Jest + Testing Library    | Unit/integration tests    |
| CI/CD      | GitHub Actions            | Automated checks          |
| Monitoring | Sentry                    | Error tracking            |

**See [TECHNICAL.md](../docs/TECHNICAL.md)** for Architecture Decision Records (ADRs) and detailed technical documentation.

---

## ⚡ Quick Commands

```bash
# Development
npm start              # Start Expo dev server
npm run type-check     # TypeScript validation
npm test               # Run Jest tests

# Database
supabase migration new <name>  # Create new migration
supabase db push               # Apply migrations
supabase db reset              # Reset database

# Git
/commit                # Smart commit (slash command)
/tasks-update          # Update TASKS.md (slash command)
```

**For complete workflow:** See [CONTRIBUTING.md](../docs/CONTRIBUTING.md)

---

## 🧪 Testing Strategy

**Three-tier approach:**

1. **Unit tests** (Jest + LokiJS) - Business logic, 36 tests currently
2. **Manual E2E** (Real SQLite) - WatermelonDB sync validation
3. **Maestro automation** (Phase 3+) - Automated E2E testing

**Key Limitation:** WatermelonDB sync protocol (`_changed`, `_status`) requires real SQLite for E2E validation (cannot be tested in Jest).

**See [TESTING.md](../docs/TESTING.md)** for complete strategy and infrastructure.

---

## 🤖 Slash Commands

Custom slash commands in `.claude/commands/`:

- **/commit** - Smart git commit with strict commitlint validation
- **/tasks-update** - Auto-magic task completion with cascade updates

---

## 🗄️ Database Migrations

### Supabase Workflow

```bash
# Create migration
supabase migration new feature_name

# Apply to remote
supabase db push

# Reset (destroys + recreates)
supabase db reset
```

### WatermelonDB Sync

When changing schema:

1. Update `src/services/database/local/schema.ts` (increment version)
2. Add migration in `src/services/database/local/migrations.ts`
3. Sync schema version between Supabase and WatermelonDB

**Best Practices:**

- One logical change per migration
- Test with `supabase db reset` before committing
- Never edit applied migrations - create new one

---

## 📚 Documentation Map

**Choose the right document for your task:**

| Document                  | When to Read                  | Purpose                                   |
| ------------------------- | ----------------------------- | ----------------------------------------- |
| **PRD.md** 📄             | Understanding product vision  | Product requirements, user stories, goals |
| **ROADMAP.md** 🗺️         | Understanding phases sequence | MVP phases overview and critical path     |
| **PHASE1_PLAN.md** 📐     | Implementing Phase 1          | Authentication implementation guide       |
| **TASKS.md** 📋           | Planning next tasks           | Kanban board and task tracking            |
| **BACKLOG.md** 💡         | Exploring future features     | Post-MVP enhancements                     |
| **CHANGELOG.md** 📝       | Reviewing completed work      | Release notes and milestones              |
| **ARCHITECTURE.md** 🏗️    | Understanding code structure  | Folder organization and patterns          |
| **DATABASE.md** 💾        | Working with database         | WatermelonDB schema and operations        |
| **TECHNICAL.md** 🎓       | Understanding tech decisions  | Architecture Decision Records             |
| **TESTING.md** 🧪         | Understanding test strategy   | Three-tier testing approach               |
| **DEVOPS_PIPELINE.md** 🔄 | Setting up CI/CD              | DevOps pipeline and deployment            |
| **CONTRIBUTING.md** ⭐    | Setup & daily workflow        | Developer guide and commands              |
| **TROUBLESHOOTING.md** 🆘 | When something breaks         | Common issues and solutions               |

---

## 📝 Documentation Update Protocol

**CRITICAL:** Be ULTRA-PRECISE with documentation updates.

**4-step process:**

1. **Read file first** - Verify content and line numbers
2. **Announce exact changes** - File, line, before/after
3. **Execute with Edit tool** - Use exact strings
4. **Verify change applied** - Read file again to confirm

**Example:**

```markdown
📄 File: docs/TASKS.md
📍 Section: Phase 1, Task 1.1 (line 209)
✏️ Change: Mark checkbox [x]

Before: - [ ] 1.1 Task description
After: - [x] 1.1 Task description
```

**Single Source of Truth:** Never duplicate info across docs. Each document has a single responsibility (see Documentation Map above).

---

## 🎓 Development Standards

**Key Principles:**

- TypeScript strict mode, no `any` types
- Data persistence: Local database first, cloud sync when available
- All features functional without internet
- **Avoid temporary comments** - Comments that quickly become outdated (e.g., "Current: 37 tests", "TODO(Phase 2.1)") should be avoided. Reference documentation files instead (e.g., "see TESTING.md for strategy")

**For complete standards:** See [TECHNICAL.md](../docs/TECHNICAL.md) and [CONTRIBUTING.md](../docs/CONTRIBUTING.md)
