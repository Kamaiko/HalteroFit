# ADR-019: ESLint + Prettier for Linting and Formatting

**Status:** Accepted
**Date:** 2025-10
**Category:** Platform

## Context

On a solo-developer project, code style inconsistencies accumulate silently — there is no pull request reviewer to catch them. Without automated enforcement, style drift makes the codebase harder to read over time and causes noisy diffs when style is corrected in bulk. More critically, common React Native mistakes (missing dependency arrays, incorrect hook usage, importing from the wrong package) are not caught by TypeScript alone and require a linter to surface before they reach runtime. Automation via pre-commit hooks ensures these checks run without relying on developer discipline.

## Decision

Use ESLint (with the Expo preset as the base configuration) for static analysis and Prettier for opinionated code formatting. Both tools run automatically on staged files via lint-staged in the pre-commit hook (Husky). The same checks run in CI on every pull request, ensuring the pre-commit hook cannot be bypassed.

## Consequences

### Benefits

- ESLint catches common React and React Native errors (hook rules, missing keys, incorrect imports) before they reach runtime
- Prettier enforces a single, non-negotiable format — no style debates, no manual formatting effort
- Auto-fix on save (IDE integration) means most formatting issues are resolved without any developer action
- Pre-commit hook (lint-staged) ensures only formatted, lint-passing code enters the repository
- CI duplication of the same checks means skipping the pre-commit hook (e.g., `--no-verify`) does not bypass quality gates
- Expo preset includes React Native-specific rules and is kept in sync with SDK updates

### Trade-offs

- lint-staged spawns separate Node processes per file (ESLint + Prettier); with many staged files this can be slow on Windows (see project memory for mitigation notes)
- lint-staged only processes file types matched by its glob patterns — new file types added to the repo must also be added to lint-staged config, otherwise CI and local hooks diverge
- Prettier's opinionated defaults occasionally conflict with developer preference, but the uniformity benefit outweighs personal style

## References

- Related: [ADR-020](020-github-actions-cicd.md) (GitHub Actions — CI runs the same lint/format checks)
- Related: [ADR-017](017-typescript-strict.md) (TypeScript strict mode — ESLint enforces `no-explicit-any` at the linter layer)
- Docs: [PIPELINE.md](../reference/PIPELINE.md)
