/**
 * Plans Stack Layout
 *
 * Stack navigation for plans-related screens.
 * Accessible via "All Plans" button from Workout tab.
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
    />
  );
}
