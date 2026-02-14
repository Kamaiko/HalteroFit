# DevOps Pipeline

This document defines the CI/CD pipeline configuration, including git hooks, GitHub Actions workflows, and branch protection rules. Single source of truth for all DevOps behavior.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Pipeline Overview](#1-pipeline-overview)
3. [Git Hooks (Husky)](#2-git-hooks-husky)
4. [GitHub Actions CI](#3-github-actions-ci)
5. [Dependency Management](#4-dependency-management)
6. [Branch Protection Rules](#5-branch-protection-rules)
7. [Troubleshooting Guide](#6-troubleshooting-guide)
8. [Maintenance Checklist](#7-maintenance-checklist)

---

## Quick Reference

**CI Jobs (3 parallel):**

1. `Lint` - TypeScript, ESLint, Prettier, npm audit, Expo Doctor
2. `Test` - Jest with coverage
3. `Secrets` - TruffleHog (informational, not a required check)

**Git Hook:** pre-commit only (lint-staged + schema version check)

**Dependency Updates:** Monthly automated report via `dep-check.yml` + GitHub security alerts

---

## 1. Pipeline Overview

### Architecture Diagram

```
Developer Workflow
       │
       ▼
┌─────────────────────────────────────────────┐
│              GIT HOOKS (Husky)               │
│  pre-commit: schema-check + lint-staged      │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│          GITHUB ACTIONS CI (3 Jobs)          │
├─────────────────────────────────────────────┤
│                                              │
│  Required for merge:                         │
│  ┌──────────────┐  ┌────────┐                │
│  │     Lint     │  │  Test  │                │
│  │ TypeScript   │  │ Jest   │                │
│  │ ESLint       │  │        │                │
│  │ Prettier     │  │        │                │
│  │ npm audit    │  │        │                │
│  │ Expo Doctor  │  │        │                │
│  └──────────────┘  └────────┘                │
│                                              │
│  Informational:                              │
│  ┌──────────┐                                │
│  │ Secrets  │  (TruffleHog, not required)    │
│  └──────────┘                                │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│         DEPLOYMENT (Future Phases)           │
│  Preview Builds (Phase 2+)                   │
│  Production Builds (Phase 3+)                │
└─────────────────────────────────────────────┘
```

### Technology Stack

| Component         | Technology            | Purpose                         |
| ----------------- | --------------------- | ------------------------------- |
| Git Hooks         | Husky                 | Pre-commit validation           |
| Code Formatting   | Prettier              | Code style consistency          |
| Linting           | ESLint                | Code quality checks             |
| Type Checking     | TypeScript            | Static type validation          |
| Testing           | Jest                  | Unit/integration tests          |
| CI                | GitHub Actions        | Automated testing               |
| Security Scanning | npm audit, TruffleHog | Vulnerability detection         |
| Dep Monitoring    | dep-check.yml         | Monthly outdated package report |

---

## 2. Git Hooks (Husky)

### 2.1 Directory Structure

```
.husky/
├── pre-commit                       # lint-staged + schema version check
├── check-schema-version.sh          # Database schema version validator
└── _/                               # Husky internal files (auto-generated)
```

### 2.2 Hook Execution Order

```
git commit -m "message"
    │
    └─► pre-commit hook (FAST - staged files only)
        ├─► 1. check-schema-version.sh (if SQL migration staged)
        └─► 2. lint-staged (format + lint staged files)
```

**Configuration files:** See [.husky/](../.husky/) for hook implementations.

---

## 3. GitHub Actions CI

### 3.1 Workflow Files

```
.github/workflows/
├── ci.yml              # Main CI pipeline (runs on push to master)
└── dep-check.yml       # Monthly dependency report (scheduled + manual)
```

---

### 3.2 CI Workflow (ci.yml)

**File:** `.github/workflows/ci.yml`
**Trigger:** `push` to `master`
**Concurrency:** Cancel in-progress runs when new commit pushed

### Job Dependency Graph

```
┌──────────────────────────────────────────────────────┐
│                 PARALLEL JOBS (Independent)           │
│                                                       │
│  Required:                                            │
│  ┌────────────┐  ┌────────┐                           │
│  │    Lint    │  │  Test  │                           │
│  └────────────┘  └────────┘                           │
│                                                       │
│  Informational:                                       │
│  ┌──────────┐                                         │
│  │ Secrets  │                                         │
│  └──────────┘                                         │
└──────────────────────────────────────────────────────┘
```

#### Job 1: Code Quality (Lint)

TypeScript type-check, ESLint, Prettier validation, npm audit (critical only), and Expo SDK compatibility check. Uses intelligent caching for TypeScript and ESLint.

#### Job 2: Unit Tests (Test)

Jest tests with coverage reporting.

#### Job 3: Secrets Scanning (informational)

TruffleHog OSS scans for API keys, credentials, private keys, and tokens. Uses `--only-verified` flag to reduce false positives. Lightweight job (no npm ci needed). Does not block pushes.

---

### 3.3 Dependency Check (dep-check.yml)

**File:** `.github/workflows/dep-check.yml`
**Trigger:** Scheduled (1st of each month at 6 AM EST) + manual dispatch
**Output:** Creates a GitHub issue with outdated packages report and security audit

**What it reports:**

- `npm outdated` - packages with available updates
- `npm audit` - security vulnerabilities
- Recommended update steps

---

## 4. Dependency Management

### Monthly Update Routine

The `dep-check.yml` workflow creates an issue monthly. To apply updates:

```bash
npm outdated                # Review what's available
npm update                  # Update within semver ranges
npx expo install --fix      # Fix Expo SDK compatibility
npm test                    # Verify nothing broke
npm run type-check          # Verify types
```

### Security Alerts

GitHub **security alerts** are enabled separately (Settings > Security). These notify about known vulnerabilities without creating PRs or branches.

### Expo-Locked Packages

These packages must ONLY be updated via `npx expo install`:

- `expo`, `expo-*` packages
- `react`, `react-native`
- `react-native-*` packages
- Native libraries (@nozbe/watermelondb, @shopify/flash-list, etc.)

Never use `npm install` or `npm update` for these.

---

## 5. Branch Protection Rules

**Branch:** `master`

### Required Status Checks

**Strict:** Yes (Require branches to be up to date before merging)

**Required Checks:**

1. `Lint`
2. `Test`

### Other Rules

- **Required linear history:** Yes (No merge commits)
- **Enforce admins:** No (Admins can bypass)
- **Allow force pushes:** No
- **Allow deletions:** No

---

## 6. Troubleshooting Guide

### check-schema-version.sh Failures

**Symptom:** Commit blocked with "schema.version not incremented"

**Fix:**

```bash
# Option 1: Increment schema version (recommended)
# Edit src/services/database/watermelon/schema.ts
# Increment: version: N → version: N+1

# Option 2: Bypass validation (if migration doesn't affect schema)
git commit --no-verify
```

### CI Failures: npm audit

**Symptom:** Lint job fails at security audit step

**Fix:**

```bash
npm audit --audit-level=critical    # Same level as CI
npm audit fix                       # Try automatic fix
```

---

## 7. Maintenance Checklist

### When Changing CI Job Names

Update branch protection rules:

```bash
gh api repos/OWNER/REPO/branches/master/protection/required_status_checks \
  -X PATCH \
  -f contexts[]='New Job Name 1' \
  -f contexts[]='New Job Name 2' \
  -F strict=true
```

### Monthly Dependency Review

1. Check for `dep-check.yml` issue on GitHub
2. Apply updates per the routine above
3. Close the issue after updating

---

## References

- [Husky Documentation](https://typicode.github.io/husky/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm audit Documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
