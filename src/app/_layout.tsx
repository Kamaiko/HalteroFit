import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalHost } from '@rn-primitives/portal';
import { Colors } from '@/constants';
import { initSentry, setSentryUser } from '@/utils/sentry';
import { useAuthStore } from '@/stores/auth/authStore';
import { initializeExercises } from '@/services/database/seed';
import '../../global.css';

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

        // Seed exercises on first launch
        await initializeExercises();

        setIsReady(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        // Still show app even if seeding fails
        setIsReady(true);
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

  // Show loading screen during initialization
  if (!isReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: Colors.background.DEFAULT,
          }}
        >
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background.DEFAULT }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.background.DEFAULT} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background.DEFAULT },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <PortalHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
