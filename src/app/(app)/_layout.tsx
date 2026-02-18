/**
 * App Layout (Protected Routes)
 *
 * Guards all authenticated routes. Redirects to /sign-in if the user
 * is not authenticated. All child routes require authentication.
 *
 * Timing: Root layout returns null until isReady (fonts + enableDevMode() +
 * exercise seeding), so isAuthenticated is settled before this layout mounts.
 */

import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { Colors } from '@/constants';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background.DEFAULT },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="exercise" />
      <Stack.Screen name="plans" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
