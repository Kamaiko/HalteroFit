import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalHost } from '@rn-primitives/portal';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '@/constants';
import { initSentry, setSentryUser } from '@/utils/sentry';
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

        // ⚠️ DEV MODE - REMOVE BEFORE PRODUCTION ⚠️
        // This enables a mock user for UI testing without Supabase auth
        // TODO: Remove this line when implementing real auth (Phase 1)
        enableDevMode();

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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background.DEFAULT }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.background.DEFAULT} />
        {/* ⚠️ DEV MODE BANNER - Remove enableDevMode() call above to hide */}
        {__DEV__ && (
          <View style={{ backgroundColor: '#ff6b35', paddingVertical: 4, paddingHorizontal: 12 }}>
            <Text style={{ color: 'white', fontSize: 11, textAlign: 'center', fontWeight: '600' }}>
              🔧 DEV MODE - Mock User Active
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
        </Stack>
        <PortalHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
