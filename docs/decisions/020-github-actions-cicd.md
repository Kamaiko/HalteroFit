# ADR-020: GitHub Actions for CI/CD and Security Scanning

**Status:** Accepted
**Date:** 2025-10
**Category:** Platform

## Context

A solo developer cannot manually run the full test, lint, and security check suite before every merge. Without automation, regressions and accidental secret commits are discovered late — often after they have already landed on the main branch. An external CI service would introduce another account to manage and potential cost. Since the repository is hosted on GitHub, GitHub Actions is the path of least resistance: no external service, no token exchange, and it is free for the workload this project generates.

## Decision

Use GitHub Actions for all continuous integration. Three jobs run in parallel on every pull request: `Lint` (ESLint, Prettier, TypeScript type-check, `npm audit`, Expo Doctor), `Test` (Jest with coverage), and `Secrets` (TruffleHog secret scanning, informational-only). Dependabot is configured for monthly grouped dependency updates with automatic merging of patch-level and GitHub Actions SHA updates. A separate `dep-check.yml` workflow catches Expo-managed packages that Dependabot should not update independently.

## Consequences

### Benefits

- Native GitHub integration — no external service account, tokens, or webhook configuration required
- Required status checks (`Lint`, `Test`) enforce that the pre-commit hook cannot be bypassed via `--no-verify`; a skipped hook still fails CI
- TruffleHog scans every commit for accidentally committed secrets (API keys, DSNs) before they propagate
- Dependabot monthly grouped PRs reduce update noise; auto-merge for patches eliminates manual maintenance toil for low-risk updates
- `dep-check.yml` provides a safety net specifically for Expo SDK-managed packages, which must be updated via `npx expo install` rather than Dependabot to avoid native module version mismatches
- Free tier is sufficient for the project's PR volume

### Trade-offs

- GitHub Actions YAML syntax is verbose; workflow files require careful maintenance as the pipeline grows
- TruffleHog job is informational-only (not a required check) — a secret commit does not block merging, relying on developer response to the annotation
- Dependabot auto-merge applies only to patches and Actions SHA updates; minor/major updates still require manual review and testing

## References

- Related: [ADR-019](019-eslint-prettier.md) (ESLint + Prettier — CI enforces the same checks as the pre-commit hook)
- Related: [ADR-002](002-three-tier-testing.md) (Testing strategy — Jest runs in the `Test` CI job)
- Docs: [PIPELINE.md](../reference/PIPELINE.md), https://docs.github.com/en/actions
