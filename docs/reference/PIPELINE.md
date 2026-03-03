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

1. `Lint` - TypeScript, ESLint, Prettier, pnpm audit, Expo Doctor
2. `Test` - Jest with coverage
3. `Secrets` - TruffleHog (informational, not a required check)

**Git Hook:** pre-commit only (lint-staged)

**Dependency Updates:** Dependabot monthly grouped PRs (patches auto-merge) + `dep-check.yml` for Expo packages

---

## 1. Pipeline Overview

### Architecture Diagram

```
Developer Workflow
       │
       ▼
┌─────────────────────────────────────────────┐
│              GIT HOOKS (Husky)               │
│  pre-commit: lint-staged (format + lint)     │
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
│  │ pnpm audit   │  │        │                │
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

| Component         | Technology             | Purpose                        |
| ----------------- | ---------------------- | ------------------------------ |
| Git Hooks         | Husky                  | Pre-commit validation          |
| Code Formatting   | Prettier               | Code style consistency         |
| Linting           | ESLint                 | Code quality checks            |
| Type Checking     | TypeScript             | Static type validation         |
| Testing           | Jest                   | Unit/integration tests         |
| CI                | GitHub Actions         | Automated testing              |
| Security Scanning | pnpm audit, TruffleHog | Vulnerability detection        |
| Dep Updates       | Dependabot             | Grouped PRs + patch auto-merge |
| Dep Monitoring    | dep-check.yml          | Monthly Expo package report    |

---

## 2. Git Hooks (Husky)

### 2.1 Directory Structure

```
.husky/
├── pre-commit                       # lint-staged (format + lint)
└── _/                               # Husky internal files (auto-generated)
```

### 2.2 Hook Execution Order

```
git commit -m "message"
    │
    └─► pre-commit hook (FAST - staged files only)
        └─► lint-staged (ESLint --fix + Prettier --write)
```

**Configuration files:** See [.husky/](../.husky/) for hook implementations.

---

## 3. GitHub Actions CI

### 3.1 Workflow Files

```
.github/
├── dependabot.yml                      # Dependabot config (monthly grouped updates)
└── workflows/
    ├── ci.yml                          # Main CI pipeline (push + PR to master)
    ├── dep-check.yml                   # Monthly dependency report (scheduled + manual)
    └── dependabot-auto-merge.yml       # Auto-merge Dependabot patch PRs
```

---

### 3.2 CI Workflow (ci.yml)

**File:** `.github/workflows/ci.yml`
**Trigger:** `push` to `master` (code paths only), `pull_request` to `master`
**Concurrency:** Cancel in-progress runs when new commit pushed
**Path filtering:** Uses `dorny/paths-filter` to skip Lint/Test on docs-only changes

### Job Dependency Graph

```
┌──────────────────────────────────────────────────────┐
│  Detect Changes (dorny/paths-filter)                  │
│  Determines if code paths changed                     │
└───────────────────────┬──────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
  ┌────────────┐  ┌────────┐  ┌──────────┐
  │    Lint    │  │  Test  │  │ Secrets  │
  │ (if code)  │  │(if code)│  │ (always) │
  └────────────┘  └────────┘  └──────────┘
          │             │             │
          └─────────────┼─────────────┘
                        ▼
              ┌───────────────┐
              │   CI Status   │  ← Branch protection check
              │   (gate job)  │
              └───────────────┘
```

**Docs-only PRs:** Lint + Test are skipped → CI Status passes immediately (~10s).
**Code PRs:** Lint + Test run normally → CI Status passes/fails based on results.

#### Job 1: Code Quality (Lint)

TypeScript type-check, ESLint, Prettier validation, pnpm audit (critical only), and Expo SDK compatibility check. Uses intelligent caching for TypeScript and ESLint.

#### Job 2: Unit Tests (Test)

Jest tests with coverage reporting.

#### Job 3: Secrets Scanning (informational)

TruffleHog OSS scans for API keys, credentials, private keys, and tokens. Uses `--only-verified` flag to reduce false positives. Lightweight job (no install step needed). Does not block pushes.

---

### 3.3 Dependency Check (dep-check.yml)

**File:** `.github/workflows/dep-check.yml`
**Trigger:** Scheduled (1st of each month at 6 AM EST) + manual dispatch
**Output:** Creates a GitHub issue with 3 sections:

1. **Expo SDK Status** — signals when a new SDK major version is available
2. **Safe to Update** — packages within semver range (excludes Expo-managed)
3. **Security Audit** — `pnpm audit` vulnerability report

---

## 4. Dependency Management

### Dependabot (Automated)

**Config:** `.github/dependabot.yml`
**Schedule:** Monthly (Mondays, 2:00 PM EST)

Dependabot creates grouped PRs:

| PR Group       | Contents                        | Auto-merge?                |
| -------------- | ------------------------------- | -------------------------- |
| `patches`      | All patch bumps (1.0.0→1.0.1)   | Yes (CI must pass)         |
| Individual     | Minor + major bumps (1 PR each) | No — manual review         |
| `actions`      | GitHub Actions SHA updates      | Yes                        |
| Security fixes | Individual CVE patches          | Yes if patch, no if minor+ |

**Auto-merge workflow:** `.github/workflows/dependabot-auto-merge.yml` squash-merges patch PRs after CI passes (no approval needed — solo dev). Minor/major PRs get individual PRs for manual review.

**Expo packages are ignored** — Dependabot can't ensure SDK compatibility. These are caught by `dep-check.yml` instead.

### Monthly Dependency Report (dep-check.yml)

The `dep-check.yml` workflow creates a monthly issue with Expo SDK status, safe-to-update packages, and security audit. Expo-managed packages are filtered out (use `npx expo install --fix` for those):

```bash
pnpm outdated -r                                           # Review what's available
pnpm --filter @halterofit/mobile exec expo install --fix  # Fix Expo SDK compatibility
pnpm test                                                  # Verify nothing broke
pnpm --filter @halterofit/mobile run type-check            # Verify types
```

### Expo-Locked Packages

These packages must ONLY be updated via `npx expo install`:

- `expo`, `expo-*`, `@expo/*` packages
- `react`, `react-native`
- `react-native-*`, `@react-native/*` packages
- Native libraries (@nozbe/watermelondb, @shopify/flash-list, @shopify/react-native-skia, react-native-mmkv)
- `babel-preset-expo` (Expo SDK-coupled build tooling)
- `react-test-renderer` (must match Expo-managed `react` version exactly)
- `nativewind` + `tailwindcss` (NativeWind v4 requires Tailwind v3 — coordinate upgrade)

Never use `pnpm add` or `pnpm update` directly for these — they may install SDK-incompatible versions.

---

## 5. Branch Protection Rules

**Branch:** `master`

### Required Status Checks

**Strict:** Yes (Require branches to be up to date before merging)

**Required Checks:**

1. `CI Status` (gate job — aggregates Lint + Test results)

### Other Rules

- **Required linear history:** Yes (No merge commits)
- **Enforce admins:** No (Admins can bypass)
- **Allow force pushes:** No
- **Allow deletions:** No

---

## 6. Troubleshooting Guide

### CI Failures: pnpm audit

**Symptom:** Lint job fails at security audit step

**Fix:**

```bash
pnpm audit --audit-level critical   # Same level as CI
pnpm audit --fix                    # Try automatic fix
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
- [pnpm audit Documentation](https://pnpm.io/cli/audit)
