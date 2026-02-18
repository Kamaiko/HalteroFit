/**
 * Plans Stack Layout
 *
 * Stack navigation for plans-related screens.
 * Includes: plan list (index), edit day.
 */

import { Stack } from 'expo-router';

import { Colors } from '@/constants';

export default function PlansLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: 'All Plans',
        headerStyle: { backgroundColor: Colors.background.DEFAULT },
        headerTintColor: Colors.foreground.DEFAULT,
        headerBackTitle: '',
        contentStyle: { backgroundColor: Colors.background.DEFAULT },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-day" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
}
