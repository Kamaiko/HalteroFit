# Sentry Setup Guide

This guide explains how to configure Sentry for production error monitoring. Configure the DSN early (Phase 1 recommended) to catch errors during development and testing, even though error reporting only activates in production builds.

## Table of Contents

- [Current Status (Phase 1)](#-current-status-phase-1)
- [What is Sentry?](#what-is-sentry)
- [Step 1: Create Sentry Account](#step-1-create-sentry-account-free)
- [Step 2: Setup with Sentry Wizard](#step-2-setup-with-sentry-wizard-recommended)
- [Step 3: Find Your DSN](#step-3-find-your-dsn-if-already-created)
- [Step 4: Verify Installation](#step-4-verify-installation)
- [Step 5: Test in Development](#step-5-test-in-development)
- [Monitoring in Production](#monitoring-in-production-phase-3)
- [Configuration Options](#configuration-options)
- [Privacy & Security](#privacy--security)
- [Pricing](#pricing)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

---

## 📍 Current Status (Phase 1)

**Phase:** Authentication & Foundation
**Sentry Status:** ✅ Installed & Configured | ⚠️ DSN Not Set Yet
**Next Step:** Configure DSN (see Task 1.10 in [TASKS.md](TASKS.md#phase-1-authentication--foundation))
**Production:** Not deployed yet (Sentry activates in production builds only)

**Quick Setup (5 minutes):**

1. Run Sentry Wizard: `npx @sentry/wizard@latest -i reactNative`
2. Add DSN to `.env`: `EXPO_PUBLIC_SENTRY_DSN=your-dsn-here`
3. Verify: `npm start` (should see `[Sentry] Disabled in development mode`)

---

## What is Sentry?

Sentry is a production error monitoring service that:

- Captures crashes and errors in production
- Provides detailed error context (stack traces, breadcrumbs)
- Tracks performance issues
- Alerts you when errors occur

**Important:** Sentry is **disabled in development** (`__DEV__ = true`). Only production builds send errors to Sentry.

---

## Step 1: Create Sentry Account (Free)

1. Go to: https://sentry.io/signup/
2. Create a free account (Developer plan - 5k errors/month free)
3. Verify your email

---

## Step 2: Setup with Sentry Wizard (Recommended)

**Recommended:** Use the Sentry wizard to automatically configure everything.

### Run the Wizard

```bash
npx @sentry/wizard@latest -i reactNative --saas --org halterofit --project halterofit
```

**What the wizard does:**

- ✅ Creates Sentry project (or uses existing)
- ✅ Configures SDK with your DSN
- ✅ Adds source maps upload to build
- ✅ Adds debug symbols upload
- ✅ Patches `app.json` with Sentry config

**After wizard completes:**

1. Verify `.env` has: `EXPO_PUBLIC_SENTRY_DSN=https://...`
2. Check `app.json` has Sentry config added
3. Verify `src/utils/sentry.ts` unchanged (already configured)

---

## Step 3: Find Your DSN (If Already Created)

If you already created the project or ran the wizard:

1. Go to: https://sentry.io
2. Select your organization → project: `halterofit`
3. Go to **Settings** → **Client Keys (DSN)**
4. Copy the DSN
5. Add to `.env`: `EXPO_PUBLIC_SENTRY_DSN=your-dsn-here`

---

## Step 4: Verify Installation

Sentry is already integrated in the codebase. You just need the DSN!

**Files already configured:**

- `src/utils/sentry.ts` - Sentry configuration
- `app/_layout.tsx` - Initialization at app startup
- `src/hooks/ui/useErrorHandler.ts` - Automatic error reporting

---

## Step 5: Test in Development

### Test 1: Verify Sentry is Disabled in Dev

```bash
npm start
# In Metro console, you should see:
# [Sentry] Disabled in development mode
```

**Expected:** Sentry logs that it's disabled (errors NOT sent)

### Test 2: Test Error Handling (Local)

In any component:

```typescript
import { useErrorHandler } from '@/hooks/ui/useErrorHandler';

const { handleError } = useErrorHandler();

// Trigger test error
handleError(new Error('Test error'), 'testContext');
```

**Expected:**

- Alert shown to user
- Error logged to console
- NOT sent to Sentry (dev mode)

---

## Monitoring in Production (Phase 3+)

**Note:** This section applies when app is deployed (Phase 3+). Sentry only activates in production builds.

**Quick Access:** https://sentry.io → Select `halterofit` → Issues tab

**What Sentry Provides:**

- Full error stack traces with source maps
- User context (ID, device info, app version)
- Performance monitoring (screen loads, API latencies)
- Breadcrumbs (event trail before error)

**See:** [TECHNICAL.md](TECHNICAL.md#error-monitoring--performance-tracking) for monitoring thresholds and best practices.

---

## Configuration Options

**Configuration file:** `src/utils/sentry.ts` (already configured)

**Common adjustments:**

```typescript
// Reduce sample rate for high-traffic apps
tracesSampleRate: 0.1, // 10% of transactions (default: 1.0)

// Add custom breadcrumbs
import { addSentryBreadcrumb } from '@/utils/sentry';
addSentryBreadcrumb('User started workout', 'user', 'info');

// Capture exceptions manually
import { captureSentryException } from '@/utils/sentry';
try {
  // risky operation
} catch (error) {
  captureSentryException(error, { customField: 'value' });
}
```

---

## Privacy & Security

**User Privacy:**

- Emails are scrubbed (see `beforeSend` in sentry.ts)
- Only user IDs are sent (no PII)
- IP addresses are NOT stored

**Security:**

- DSN is public (safe to expose in client code)
- Service role key stays on server (Supabase)
- Sentry uses HTTPS for all data

---

## Pricing

**Free Tier (Sufficient for MVP):**

- 5,000 errors/month
- 10,000 performance units/month
- 30-day retention

**Upgrade only if needed:** Team plan ($26/month) or Business plan ($80/month)

---

## Troubleshooting

### "Sentry not capturing errors"

1. Check DSN is set: `echo $EXPO_PUBLIC_SENTRY_DSN`
2. Verify production build (not dev mode)
3. Check network connectivity
4. Look for console errors

### "Too many events (quota exceeded)"

1. Lower `tracesSampleRate` in sentry.ts
2. Add filters in `beforeSend` function
3. Upgrade Sentry plan

### "Can't see error details"

1. Ensure source maps are uploaded (auto with EAS)
2. Check Sentry project settings
3. Verify error wasn't filtered by `beforeSend`

---

## Resources

- **Sentry Docs:** https://docs.sentry.io/platforms/react-native/
- **Sentry Dashboard:** https://sentry.io
- **React Native SDK:** https://github.com/getsentry/sentry-react-native

**Need Help?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or open an issue!
