/**
 * Exercises Stack Layout
 *
 * Defines navigation within the Exercises tab.
 */

import { Stack } from 'expo-router';
import { Colors } from '@/constants';

export default function ExercisesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background.DEFAULT },
      }}
    />
  );
}
