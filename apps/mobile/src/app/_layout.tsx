import { useEffect, useState } from 'react';
import { InteractionManager, View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalHost } from '@rn-primitives/portal';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
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

  // Preload icon fonts — no-op if already embedded via expo-font config plugin
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
    ...FontAwesome.font,
  });

  // Initialize app on startup
  useEffect(() => {
    async function initialize() {
      try {
        // Initialize Sentry
        initSentry();

        // TODO: Remove enableDevMode() when implementing real auth (Phase 4)
        if (__DEV__ || process.env.EXPO_PUBLIC_ENABLE_MOCK_AUTH === 'true') {
          enableDevMode();
        }

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

  // Wait for initialization + fonts (native splash stays visible)
  if (!isReady || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background.DEFAULT }}>
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
