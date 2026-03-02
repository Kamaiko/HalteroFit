/**
 * Exercise Stack Layout
 *
 * Defines navigation for full-screen exercise routes (outside tabs).
 * Includes: detail ([id]), browser, picker.
 */

import { Stack } from 'expo-router';
import { Colors } from '@/constants';

export default function ExerciseLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background.DEFAULT },
      }}
    />
  );
}
