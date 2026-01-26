/**
 * Exercise Selector Screen (Muscle Selector)
 *
 * Grid of muscle groups with "Show All" button.
 * MVP: Only "Show All" is active, other muscles are grayed-out placeholders.
 *
 * @see docs/reference/jefit/JEFIT_UI_SPEC.md - Section 2.1 (Muscle Selector)
 * @see docs/reference/jefit/screenshots/02-exercises/01-muscle-selector.png
 */

import { Text } from '@/components/ui/text';
import { Colors } from '@/constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Muscle group data for the grid
// MVP: Only "Show All" is active
const MUSCLE_GROUPS = [
  { id: 'triceps', label: 'Triceps', disabled: true },
  { id: 'chest', label: 'Chest', disabled: true },
  { id: 'shoulder', label: 'Shoulder', disabled: true },
  { id: 'biceps', label: 'Biceps', disabled: true },
  { id: 'abs', label: 'Abs', disabled: true },
  { id: 'back', label: 'Back', disabled: true },
  { id: 'forearms', label: 'Forearms', disabled: true },
  { id: 'upper-leg', label: 'Upper Leg', disabled: true },
  { id: 'glutes', label: 'Glutes', disabled: true },
  { id: 'cardio', label: 'Cardio', disabled: true },
  { id: 'lower-leg', label: 'Lower Leg', disabled: true },
  { id: 'show-all', label: 'Show All', disabled: false },
];

export default function ExerciseSelectorScreen() {
  const handleMusclePress = (muscleId: string) => {
    if (muscleId === 'show-all') {
      router.push('/(tabs)/exercises/list');
    }
    // Future: Navigate with muscle filter
    // router.push(`/(tabs)/exercises/list?muscle=${muscleId}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="border-b border-background-elevated px-4 py-3">
        <Text className="text-xl font-semibold text-foreground">Exercises</Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4 py-4">
        <Text className="mb-4 text-foreground-secondary">
          Select a muscle group to browse exercises
        </Text>

        {/* Grid */}
        <View className="flex-row flex-wrap justify-between">
          {MUSCLE_GROUPS.map((muscle) => (
            <MuscleCard
              key={muscle.id}
              label={muscle.label}
              disabled={muscle.disabled}
              onPress={() => handleMusclePress(muscle.id)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface MuscleCardProps {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}

function MuscleCard({ label, disabled = false, onPress }: MuscleCardProps) {
  const isShowAll = label === 'Show All';

  return (
    <Pressable
      className="mb-3 aspect-square w-[31%] items-center justify-center rounded-xl"
      style={{
        backgroundColor: disabled
          ? Colors.background.elevated
          : isShowAll
            ? Colors.primary.DEFAULT
            : Colors.background.surface,
        opacity: disabled ? 0.5 : 1,
      }}
      onPress={onPress}
      disabled={disabled}
    >
      {/* Placeholder for muscle illustration */}
      <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-background-elevated">
        <Text className="text-2xl">{isShowAll ? '📋' : '💪'}</Text>
      </View>

      <Text
        className="text-center text-sm font-medium"
        style={{
          color: disabled
            ? Colors.foreground.tertiary
            : isShowAll
              ? Colors.foreground.inverse
              : Colors.foreground.DEFAULT,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
