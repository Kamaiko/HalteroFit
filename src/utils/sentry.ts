/**
 * Sentry Configuration
 *
 * Production-only error monitoring and performance tracking.
 * Integrates with custom error classes from error handling system.
 *
 * Setup Instructions:
 * 1. Create free Sentry account: https://sentry.io/signup/
 * 2. Create new React Native project
 * 3. Copy DSN to .env: EXPO_PUBLIC_SENTRY_DSN=your-dsn-here
 * 4. Sentry only runs in production (!__DEV__)
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

/**
 * Initialize Sentry
 *
 * Call this at app startup (app/_layout.tsx)
 * Only enabled in production builds
 */
export function initSentry() {
  // Get DSN from environment variable
  const dsn = Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN;

  // Only initialize in production
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[Sentry] Disabled in development mode');
    return;
  }

  // Require DSN in production
  if (!dsn) {
    console.warn('[Sentry] DSN not configured. Set EXPO_PUBLIC_SENTRY_DSN in .env');
    return;
  }

  Sentry.init({
    // DSN from environment variable
    dsn,

    // Enable in production only
    enabled: !__DEV__,

    // Environment
    environment: __DEV__ ? 'development' : 'production',

    // Release version (from package.json)
    release: `halterofit@${Constants.expoConfig?.version || '0.1.0'}`,

    // Dist (build number for EAS)
    dist: Constants.expoConfig?.extra?.easBuildNumber?.toString(),

    // Performance Monitoring
    tracesSampleRate: 1.0, // 100% of transactions in production (adjust for high traffic)
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30 seconds

    // Integrations
    integrations: [
      // React Navigation integration for route tracking
      Sentry.reactNavigationIntegration({
        enableTimeToInitialDisplay: true,
        routeChangeTimeoutMs: 1000,
      }),
    ],

    // Before sending events (filter, scrub PII, etc.)
    beforeSend(event) {
      // Filter out non-error exceptions in development
      if (__DEV__) {
        return null;
      }

      // Scrub sensitive data (PII)
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      // Add custom context
      if (event.extra) {
        event.extra.timestamp = new Date().toISOString();
      }

      return event;
    },

    // Before sending breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Filter out console logs in production
      if (breadcrumb.category === 'console') {
        return null;
      }

      return breadcrumb;
    },
  });

  // eslint-disable-next-line no-console
  console.log('[Sentry] Initialized successfully');
}

/**
 * Set user context
 *
 * Call when user signs in to track user-specific errors
 *
 * @param userId - User ID (not email for privacy)
 */
export function setSentryUser(userId: string | null) {
  if (!__DEV__) {
    if (userId) {
      Sentry.setUser({ id: userId });
    } else {
      Sentry.setUser(null);
    }
  }
}

/**
 * Capture exception manually
 *
 * Use this for caught errors you want to report
 *
 * @param error - Error instance
 * @param context - Additional context
 */
export function captureSentryException(error: Error, context?: Record<string, unknown>) {
  if (!__DEV__) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

/**
 * Export Sentry for direct access if needed
 */
export { Sentry };
