# ADR-016: Sentry for Error Monitoring and Performance Tracking

**Status:** Accepted
**Date:** 2025-10
**Category:** Monitoring

## Context

A solo developer cannot monitor a production app manually. Without automated crash reporting, silent failures in database operations, sync logic, or navigation will go undetected until a user reports them — often after significant data loss or frustration. The app's offline-first architecture and background sync add complexity that makes runtime errors especially hard to reproduce from user reports alone. A lightweight, zero-configuration-in-development monitoring solution is needed that activates only in production builds.

## Decision

Integrate Sentry for crash reporting and performance monitoring. Sentry is initialized only when `__DEV__` is false, ensuring it has zero impact on the development workflow. All personally-identifiable information is stripped before transmission — only the user's anonymous ID is attached to events.

## Consequences

### Benefits

- Automatic crash reporting with full stack traces — errors are surfaced without relying on user reports
- Performance tracing identifies slow operations (slow database queries, long screen transitions) before they become user complaints
- `beforeSend` hook strips PII, keeping the app compliant with App Store privacy requirements
- Free tier (5,000 errors/month) is sufficient for early user acquisition; no cost until meaningful scale
- Disabled in development (`__DEV__ = true`) — zero noise in the daily workflow

### Trade-offs

- Adds a dependency on an external SaaS service; if Sentry has an outage, error data is lost for that window (events are not queued locally)
- The free tier's 5,000 errors/month cap could be hit during a crash spike; events beyond the cap are silently dropped
- `tracesSampleRate: 1.0` (100% performance tracing) is appropriate for early stage but must be reduced before high-traffic scale to avoid quota exhaustion

## References

- Related: [ADR-001](001-expo-dev-build.md) (Development Build — Sentry's native SDK requires a dev build)
- Implementation: `src/utils/sentry.ts`, `app/_layout.tsx`, `src/hooks/ui/useErrorHandler.ts`
- Docs: [SENTRY_SETUP.md](../product/SENTRY_SETUP.md), https://docs.sentry.io/platforms/react-native/
