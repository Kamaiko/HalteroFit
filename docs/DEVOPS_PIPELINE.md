# DevOps Pipeline

This document defines the complete CI/CD pipeline configuration, including git hooks, GitHub Actions workflows, Dependabot automation, and branch protection rules. Use this as the single source of truth for all DevOps behavior.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Pipeline Overview](#1-pipeline-overview)
3. [Git Hooks (Husky)](#2-git-hooks-husky)
   - [Directory Structure](#21-directory-structure)
   - [Hook Execution Order](#22-hook-execution-order)
4. [GitHub Actions CI/CD](#3-github-actions-cicd)
   - [Workflow Files](#31-workflow-files)
   - [CI Workflow (ci.yml)](#32-ci-workflow-ciyml)
   - [CD Workflows (Preview & Production)](#33-cd-workflows-preview--production)
5. [Dependabot Configuration](#4-dependabot-configuration)
6. [Branch Protection Rules](#5-branch-protection-rules)
7. [Troubleshooting Guide](#6-troubleshooting-guide)
8. [Maintenance Checklist](#7-maintenance-checklist)

---

## Quick Reference

**CI Job Names (must match branch protection):**

1. `Code Quality (TypeScript, ESLint, Prettier)`
2. `Unit Tests (Jest)`
3. `Security Scan (npm audit)`
4. `Bundle Size Check (<3MB)` (independent, not required for merge)
5. `Secrets Scanning (TruffleHog)` (independent, not required for merge)

**Dependabot Auto-Merge Rules:**

- GitHub Actions: ALL versions
- Dev dependencies: Minor + Patch
- Runtime dependencies: Patch + Minor
- Runtime dependencies: Major (comment only, manual review required)

**Required Status Checks (Branch Protection):**

- Branch: `master`
- Strict: Yes (must be up to date)
- Checks: Jobs 1-3 only (code-quality, unit-tests, security-scan)

---

## 1. Pipeline Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DEVELOPER WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        GIT HOOKS (Husky)                            │
│  • pre-commit: check-schema-version.sh, lint                        │
│  • commit-msg: commitlint (Conventional Commits)                    │
│  • pre-push: type-check, tests (prevents CI failures)               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS CI/CD (6 Jobs)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Required for Merge (Branch Protection)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Code Quality │  │ Unit Tests   │  │ Security     │               │
│  │ TypeScript   │  │ Jest         │  │ Scan         │               │
│  │ ESLint       │  │ Coverage     │  │ npm audit    │               │
│  │ Prettier     │  │              │  │              │               │
│  └──────┬───────┘  └───────┬──────┘  └───────┬──────┘               │
│         └──────────────────┴─────────────────┘                      │
│                            │                                        │
│                            ▼                                        │
│                   ┌────────────────────┐                            │
│                   │ Dependabot         │                            │
│                   │ Auto-Merge         │                            │
│                   │ (if bot PR)        │                            │
│                   └────────────────────┘                            │
│                                                                     │
│  Independent (Informational Only)                                   │
│  ┌──────────────┐  ┌──────────────┐                                 │
│  │ Bundle Size  │  │ Secrets Scan │                                 │
│  │ <3MB check   │  │ TruffleHog   │                                 │
│  └──────────────┘  └──────────────┘                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT (Future Phases)                       │
│  • Preview Builds (Phase 2+)                                        │
│  • Production Builds (Phase 3+)                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component          | Technology            | Purpose                              |
| ------------------ | --------------------- | ------------------------------------ |
| Git Hooks          | Husky                 | Pre-commit/commit-msg validation     |
| Commit Linting     | commitlint            | Conventional Commits enforcement     |
| Code Formatting    | Prettier              | Code style consistency               |
| Linting            | ESLint                | Code quality checks                  |
| Type Checking      | TypeScript            | Static type validation               |
| Testing            | Jest                  | Unit/integration tests               |
| CI/CD              | GitHub Actions        | Automated testing and deployment     |
| Dependency Updates | Dependabot            | Automated dependency version updates |
| Security Scanning  | npm audit, TruffleHog | Vulnerability detection              |

---

## 2. Git Hooks (Husky)

### 2.1 Directory Structure

```
.husky/
├── pre-commit                       # Fast checks: lint + format (staged files only)
├── commit-msg                       # Commit message validation (Conventional Commits)
├── pre-push                         # Slow checks: type-check + tests (prevents CI wait)
├── validate-tasks.sh                # TASKS.md integrity checker
├── check-schema-version.sh          # Database schema version validator
└── _/                               # Husky internal files (auto-generated)
```

### 2.2 Hook Execution Order

```
git commit -m "message"
    │
    ├─► pre-commit hook (FAST - staged files only)
    │   ├─► 1. check-schema-version.sh (if SQL migration staged)
    │   └─► 2. lint-staged (format + lint staged files)
    │
    ├─► commit-msg hook
    │   └─► commitlint (validate message format)
    │
    └─► Commit created ✅

git push
    │
    └─► pre-push hook (SLOW - prevents CI failures)
        ├─► 1. npm run type-check (TypeScript validation)
        └─► 2. npm run test (Jest unit tests)
```

**Configuration files:** See [.husky/](../.husky/) for hook implementations and [.commitlintrc.json](../.commitlintrc.json) for commit message rules.

---

## 3. GitHub Actions CI/CD

### 3.1 Workflow Files

```
.github/workflows/
├── ci.yml              # Main CI pipeline (active - runs on push/PR)
├── cd-preview.yml      # Preview builds (disabled - Phase 2+)
└── cd-production.yml   # Production builds (disabled - Phase 3+)
```

---

### 3.2 CI Workflow (ci.yml)

**File:** `.github/workflows/ci.yml`
**Triggers:** `push` to `master`, `pull_request` to `master`
**Concurrency:** Cancel in-progress runs when new commit pushed

### Job Dependency Graph

```
┌──────────────────────────────────────────────────────────┐
│                    PARALLEL JOBS (Independent)           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ code-quality │  │ unit-tests   │  │ security-scan│    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                      │
│  │ bundle-size  │  │ secrets-scan │                      │
│  └──────────────┘  └──────────────┘                      │
└──────────────────────────────────────────────────────────┘
                           │
                           │ (all pass)
                           ▼
              ┌────────────────────────┐
              │ dependabot-auto-merge  │
              │ (Only if Dependabot PR)│
              │                        │
              │ needs: [code-quality,  │
              │  unit-tests,           │
              │  security-scan]        │
              └────────────────────────┘
```

**Note:** `bundle-size-check` and `secrets-scan` run independently. Dependabot auto-merge only waits for the 3 critical jobs (code-quality, unit-tests, security-scan).

#### Job 1: Code Quality

TypeScript type-check, ESLint, Prettier validation with intelligent caching.

#### Job 2: Unit Tests

Jest tests with coverage reporting. Coverage threshold (40%) will be enforced in Phase 1+.

#### Job 3: Security Scan

npm audit with `--audit-level=critical` (blocks only CRITICAL vulnerabilities, HIGH false positives from CLI-only dependencies ignored).

#### Job 4: Dependabot Auto-Merge

Automatically merges safe Dependabot PRs after CI passes. Rules:

- ✅ GitHub Actions: ALL versions
- ✅ Dev dependencies: Minor + Patch
- ✅ Runtime dependencies: Patch + Minor
- 💬 Runtime dependencies: Major (comment only, manual review required)

---

#### Job 5: Bundle Size Check

Monitors JavaScript bundle size (<3MB threshold for Phase 1). Comments on PRs with size analysis.

**Local Analysis:** Use Expo Atlas for detailed bundle composition analysis:

```bash
EXPO_ATLAS=true npx expo export --platform android
npx expo-atlas .expo/atlas.jsonl
```

See [Expo Atlas docs](https://docs.expo.dev/guides/analyzing-bundles/) for details.

#### Job 6: Secrets Scanning

TruffleHog OSS scans for API keys, credentials, private keys, and tokens. Uses `--only-verified` flag to reduce false positives.

---

### 3.3 CD Workflows (Preview & Production)

**Status:** Both DISABLED (workflow_dispatch only)
**Files:** `.github/workflows/cd-preview.yml`, `.github/workflows/cd-production.yml`

**CD Preview (Phase 2+):**

- Purpose: EAS Development/Preview builds for QA testing
- Why disabled: Infrastructure changing frequently, EAS build limits (30/month free tier)

**CD Production (Phase 3+):**

- Purpose: EAS Production builds for App Store/Play Store submission
- Why disabled: No production-ready features yet

**When to Enable:**

- Preview: Features stable for QA (2-3 builds/week max, auto-trigger on `needs-qa` label)
- Production: MVP complete (auto-trigger on version tags `v1.0.0`, etc.)

---

## 4. Dependabot Configuration

**File:** `.github/dependabot.yml`
**Version:** 2
**Schedule:** Weekly (Monday 09:00 EST)

### NPM Dependencies

**Configuration:**

```yaml
package-ecosystem: 'npm'
directory: '/'
schedule:
  interval: 'weekly'
  day: 'monday'
  time: '09:00'
  timezone: 'America/New_York'
open-pull-requests-limit: 8
```

> **Increased from 5 to 8:** Dependabot groups reduce PR noise, higher limit allows more concurrent updates

### Dependency Groups

#### Group 1: dev-dependencies (Auto-merged minor/patch)

**Patterns:** TypeScript types, ESLint, Prettier, Jest, Commitlint, Testing Library
**Update types:** Minor + Patch
**Auto-merge:** ✅ (after CI passes)

#### Group 2: runtime-patches (Auto-merged patch only)

**Patterns:** All runtime dependencies (excluding dev tools and critical packages)
**Excludes:** Expo, React, React Native, WatermelonDB, Supabase
**Update types:** Patch only
**Auto-merge:** ✅ (after CI passes)

> **See:** [.github/dependabot.yml](../.github/dependabot.yml) for complete patterns and exclusions

### Ignored Dependencies (Fully Locked)

**Critical packages locked to ALL versions (patch/minor/major):**

1. **React** (`react`, `react-test-renderer`): Must match react-native-renderer exactly (19.0.0)
2. **React Native Worklets**: Must match Reanimated 4.x requirement (0.5.x range)

**Packages locked to minor/major only:**

1. **Tailwind CSS v4**: Incompatible with NativeWind v4 (requires NativeWind v5 preview)
2. **React Native**: Locked to Expo SDK version (never upgrade independently)
3. **Expo SDK**: Only patch updates auto-allowed (minor/major require migration guide review)
4. **React Native ecosystem**: Major updates blocked (follow Expo SDK compatibility)

> **See:** [.github/dependabot.yml](../.github/dependabot.yml) for complete ignore rules

### GitHub Actions

**Configuration:**

```yaml
package-ecosystem: 'github-actions'
directory: '/'
schedule:
  interval: 'weekly'
  day: 'monday'
  time: '09:00'
  timezone: 'America/New_York'
open-pull-requests-limit: 3
```

**Auto-merge:** ALL versions (patch, minor, major)
**Rationale:** SHA-pinned actions are secure + non-breaking

---

## 5. Branch Protection Rules

**Branch:** `master`
**Updated:** 2025-01-05

### Required Status Checks

**Strict:** ✅ (Require branches to be up to date before merging)

**Required Checks:**

1. `Code Quality (TypeScript, ESLint, Prettier)`
2. `Unit Tests (Jest)`
3. `Security Scan (npm audit)`

### Other Rules

- **Required linear history:** ✅ (No merge commits)
- **Enforce admins:** ❌ (Admins can bypass)
- **Allow force pushes:** ❌ (Disabled)
- **Allow deletions:** ❌ (Branch cannot be deleted)
- **Required reviews:** ❌ (Not configured)
- **Required signatures:** ❌ (Not configured)

---

## 6. Troubleshooting Guide

### Dependabot PRs Not Auto-Merging

**Symptoms:**

- PRs have `auto-merge` enabled by bot
- All CI checks pass (green)
- PRs stuck in `BLOCKED` or `BEHIND` state

**Diagnosis:**

```bash
# Check PR merge status
gh pr view <PR_NUMBER> --json mergeStateStatus,autoMergeRequest,statusCheckRollup

# Check branch protection
gh api repos/OWNER/REPO/branches/master/protection
```

**Common Causes:**

1. **Obsolete required status checks**

   ```json
   {
     "required_status_checks": {
       "contexts": ["Old Check Name That Doesn't Exist"]
     }
   }
   ```

   **Fix:** Update branch protection with current job names

2. **PR behind master**

   ```json
   {
     "mergeStateStatus": "BEHIND"
   }
   ```

   **Fix:** Rebase PR (comment `@dependabot rebase`)

3. **Merge conflicts**
   ```json
   {
     "mergeStateStatus": "DIRTY"
   }
   ```
   **Fix:** Resolve conflicts manually or close PR (Dependabot will recreate)

### check-schema-version.sh Failures

**Symptom:** Commit blocked with "schema.version not incremented"

**Fix:**

```bash
# Option 1: Increment schema version (recommended)
# Edit src/services/database/watermelon/schema.ts
# Change: version: 5
# To: version: 6

# Option 2: Bypass validation (if migration doesn't affect schema)
git commit --no-verify
```

### CI Failures: npm audit

**Symptom:** Security Scan job fails with vulnerabilities

**Diagnosis:**

```bash
# Run locally (same level as CI)
npm audit --audit-level=critical

# Check all vulnerabilities
npm audit
```

**Fix:**

```bash
# Try automatic fix
npm audit fix

# If fix not available
# 1. Check if vulnerability is in dev dependency (low risk)
# 2. Check if patch available (update manually)
# 3. Check if vulnerability exploitable in your use case
# 4. Document decision in commit message if accepting risk
```

---

## 7. Maintenance Checklist

### When Changing CI Job Names

**Action required:** Update branch protection rules

**Steps:**

```bash
# 1. Update .github/workflows/ci.yml job names
# 2. Push changes
# 3. Run workflow once to create new check
# 4. Update branch protection
gh api repos/OWNER/REPO/branches/master/protection/required_status_checks \
  -X PATCH \
  -f contexts[]='New Job Name 1' \
  -f contexts[]='New Job Name 2' \
  -F strict=true
```

### When Adding New Workflows

**Action required:** None (unless required for merging)

**Optional:** Add to branch protection if should block merges

---

## References

- [Husky Documentation](https://typicode.github.io/husky/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dependabot Configuration Reference](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [npm audit Documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
