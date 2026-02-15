import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalHost } from '@rn-primitives/portal';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '@/constants';
import { initSentry, setSentryUser, Sentry } from '@/utils/sentry';
import { ErrorFallbackScreen } from '@/components/layout';
import { useAuthStore, enableDevMode } from '@/stores/auth/authStore';
import { initializeExercises } from '@/services/database/seed';
import '../../global.css';

// Keep native splash visible until app is ready
SplashScreen.preventAutoHideAsync();

/**
 * Root Layout
 *
 * Initializes:
 * - Sentry (production-only error monitoring)
 * - Exercise database seeding (first launch only)
 * - PortalHost (for dropdowns, tooltips, modals)
 */
export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  // Initialize app on startup
  useEffect(() => {
    async function initialize() {
      try {
        // Initialize Sentry
        initSentry();

        // DEV MODE: mock user for UI testing without Supabase auth
        // Remove when implementing real auth (Phase 1)
        if (__DEV__) {
          enableDevMode();
        }

        // Seed exercises on first launch
        await initializeExercises();

        setIsReady(true);
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('App initialization failed:', error);
        // Still show app even if seeding fails
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    initialize();
  }, []);

  // Sync Sentry user context with auth state
  useEffect(() => {
    const user = useAuthStore.getState().user;
    setSentryUser(user?.id || null);

    // Subscribe to auth changes
    const unsubscribe = useAuthStore.subscribe((state) => {
      setSentryUser(state.user?.id || null);
    });

    return unsubscribe;
  }, []);

  // Wait for initialization (native splash stays visible)
  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1 bg-background">
      <Sentry.ErrorBoundary fallback={ErrorFallbackScreen}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor={Colors.background.DEFAULT} />
          {__DEV__ && (
            <View
              style={{
                backgroundColor: Colors.dev.banner,
                paddingVertical: 4,
                paddingHorizontal: 12,
              }}
            >
              <Text
                style={{ color: 'white', fontSize: 11, textAlign: 'center', fontWeight: '600' }}
              >
                [DEV] Mock User Active
              </Text>
            </View>
          )}
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background.DEFAULT },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="exercise" options={{ headerShown: false }} />
            <Stack.Screen name="plans" options={{ headerShown: false }} />
          </Stack>
          <PortalHost />
        </SafeAreaProvider>
      </Sentry.ErrorBoundary>
    </GestureHandlerRootView>
  );
}
