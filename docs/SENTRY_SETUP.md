# Sentry Setup

Quick reference for Sentry error monitoring configuration and usage.

**Status:** Installed & Configured (see package.json for current version)
**Configuration:** `src/utils/sentry.ts`
**Dashboard:** https://sentry.io

---

## Current Setup

**Files configured:**

- `src/utils/sentry.ts` - Sentry initialization and utilities
- `app/_layout.tsx` - Sentry init at app startup
- `src/hooks/ui/useErrorHandler.ts` - Automatic error reporting
- `.env.example` - DSN placeholder

**Behavior:**

- **Development:** Disabled (`__DEV__ = true`)
- **Production:** Enabled (activates automatically in EAS builds)

---

## Configuration

**Sample rate adjustment** (`src/utils/sentry.ts`):

```typescript
tracesSampleRate: 1.0, // 100% (default) - reduce for high traffic
```

**Manual exception capture:**

```typescript
import { captureSentryException } from '@/utils/sentry';
captureSentryException(error, { context: 'value' });
```

**See:** [TECHNICAL.md - Error Monitoring](TECHNICAL.md#error-monitoring--performance-tracking) for thresholds and best practices.

---

## Monitoring (Phase 3+)

**Dashboard:** https://sentry.io → `halterofit` project → Issues tab

**What's tracked:**

- Crashes and errors with full stack traces
- User context (ID, device, app version)
- Performance metrics (screen loads, API latencies)
- Breadcrumbs (event trail before errors)

---

## Privacy & Security

- Emails scrubbed via `beforeSend` hook
- Only user IDs sent (no PII)
- IP addresses not stored
- DSN is public (safe in client code)

---

## Pricing

**Free Tier (MVP sufficient):**

- 5,000 errors/month
- 10,000 performance units/month
- 30-day retention

---

## Troubleshooting

**"Sentry not capturing errors":**

1. Check DSN: `echo $EXPO_PUBLIC_SENTRY_DSN`
2. Verify production build (not dev mode)
3. Check network connectivity

**"Quota exceeded":**

1. Lower `tracesSampleRate` in sentry.ts
2. Add filters in `beforeSend`

**"Can't see error details":**

1. Ensure source maps uploaded (auto with EAS)
2. Check Sentry project settings

---

## Resources

- **Docs:** https://docs.sentry.io/platforms/react-native/
- **Dashboard:** https://sentry.io
- **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
