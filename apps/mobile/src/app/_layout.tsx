import { useEffect, useState } from 'react';
import { InteractionManager, View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalHost } from '@rn-primitives/portal';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { useFonts } from 'expo-font';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants';
import { initSentry, setSentryUser, Sentry } from '@/utils/sentry';
import { ErrorFallbackScreen } from '@/components/layout';
import { useAuthStore, enableDevMode } from '@/stores/auth/authStore';
import { supabase } from '@/services/supabase';
import { setupAuthListener, createSessionFromUrl, mapUser } from '@/services/auth';
import { initializeExercises } from '@/services/database/seed';
import { setupAutoSync, manualSync } from '@/services/database';
import '../../global.css';

// Keep native splash visible until app is ready
SplashScreen.preventAutoHideAsync();

const IS_MOCK_AUTH = process.env.EXPO_PUBLIC_ENABLE_MOCK_AUTH === 'true';

/**
 * Root Layout
 *
 * Initializes:
 * - Sentry (production-only error monitoring)
 * - Supabase auth session restore + listener (production)
 * - Deep link handling for password reset
 * - Exercise database seeding (first launch only)
 * - PortalHost (for dropdowns, tooltips, modals)
 */
export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  // Preload icon fonts — no-op if already embedded via expo-font config plugin
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
    ...FontAwesome.font,
  });

  // Initialize app on startup
  useEffect(() => {
    if (IS_MOCK_AUTH) {
      enableDevMode();
      initSentry();
      initializeExercises()
        .then(() => setIsReady(true))
        .catch(() => setIsReady(true));
      return;
    }

    // Set up listener FIRST (sync) so no auth events are missed
    let unsubscribe: (() => void) | undefined;
    if (supabase) {
      unsubscribe = setupAuthListener();
    }

    async function initialize() {
      try {
        initSentry();

        // Auth state is handled by setupAuthListener (INITIAL_SESSION event)
        if (!supabase) {
          useAuthStore.getState().setLoading(false);
        }

        await initializeExercises();
        setIsReady(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setIsReady(true);
      }
    }

    initialize();
    return () => unsubscribe?.();
  }, []);

  // Handle deep links (password reset + email verification)
  const url = Linking.useURL();
  useEffect(() => {
    if (url) {
      createSessionFromUrl(url).catch((error) => {
        if (__DEV__) console.warn('Deep link session error:', error);
      });

      // Refresh user data after deep link — handles email verification
      // (verify redirect has no access_token, so createSessionFromUrl returns null,
      // but the email IS confirmed server-side — getUser() fetches the updated state)
      if (supabase) {
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) {
            useAuthStore.getState().setUser(mapUser(data.user));
          }
        });
      }
    }
  }, [url]);

  // Hide splash only when both app init AND fonts are ready
  useEffect(() => {
    if (isReady && (fontsLoaded || fontError)) {
      InteractionManager.runAfterInteractions(() => {
        SplashScreen.hideAsync();
      });
    }
  }, [isReady, fontsLoaded, fontError]);

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

  // Start/stop auto-sync based on auth state
  useEffect(() => {
    let unsubscribeSync: (() => void) | undefined;

    // If already authenticated at mount, start sync immediately
    if (useAuthStore.getState().isAuthenticated) {
      unsubscribeSync = setupAutoSync();
      manualSync().catch(() => {});
    }

    // React to auth state changes
    const unsubscribeAuth = useAuthStore.subscribe((state, prevState) => {
      if (state.isAuthenticated && !prevState.isAuthenticated) {
        // Signed in → start auto-sync + initial pull
        unsubscribeSync = setupAutoSync();
        manualSync().catch(() => {});
      } else if (!state.isAuthenticated && prevState.isAuthenticated) {
        // Signed out → stop auto-sync
        unsubscribeSync?.();
        unsubscribeSync = undefined;
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSync?.();
    };
  }, []);

  // Wait for initialization + fonts (native splash stays visible)
  if (!isReady || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background.DEFAULT }}>
      <Sentry.ErrorBoundary fallback={ErrorFallbackScreen}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor={Colors.background.DEFAULT} />
          {__DEV__ && IS_MOCK_AUTH && (
            <View
              style={{
                backgroundColor: Colors.dev.banner,
                paddingVertical: 4,
                paddingHorizontal: 12,
              }}
            >
              <Text
                style={{
                  color: Colors.primary.foreground,
                  fontSize: 11,
                  textAlign: 'center',
                  fontWeight: '600',
                }}
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
            <Stack.Screen name="(app)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <PortalHost />
        </SafeAreaProvider>
      </Sentry.ErrorBoundary>
    </GestureHandlerRootView>
  );
}
