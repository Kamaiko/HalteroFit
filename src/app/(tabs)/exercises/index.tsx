/**
 * Exercise Selector Screen (Muscle Selector)
 *
 * Grid of muscle groups for filtering exercises.
 *
 * @see docs/reference/jefit/JEFIT_UI_SPEC.md - Section 2.1 (Muscle Selector)
 */

import { memo, useCallback } from 'react';
import { Text } from '@/components/ui/text';
import { MuscleGroupIcon } from '@/components/exercises/MuscleGroupIcon';
import { ScreenContainer } from '@/components/layout';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

// ============================================================================
// Types & Constants
// ============================================================================

type FilterType = 'bodyPart' | 'targetMuscle';

interface MuscleGroup {
  id: string;
  label: string;
  filterType?: FilterType;
  filterValue?: string;
}

/** Muscle groups mapped to ExerciseDB dataset values, ordered for 5×3 aesthetic grid */
const MUSCLE_GROUPS: MuscleGroup[] = [
  // Row 1: Upper body (shoulders/back)
  { id: 'shoulder', label: 'Delts', filterType: 'bodyPart', filterValue: 'shoulders' },
  { id: 'traps', label: 'Traps', filterType: 'targetMuscle', filterValue: 'traps' },
  { id: 'upper-back', label: 'Upper Back', filterType: 'targetMuscle', filterValue: 'upper back' },
  // Row 2: Torso + arms (push/pull)
  { id: 'biceps', label: 'Biceps', filterType: 'targetMuscle', filterValue: 'biceps' },
  { id: 'chest', label: 'Chest', filterType: 'bodyPart', filterValue: 'chest' },
  { id: 'triceps', label: 'Triceps', filterType: 'targetMuscle', filterValue: 'triceps' },
  // Row 3: Core + support
  { id: 'forearms', label: 'Forearms', filterType: 'targetMuscle', filterValue: 'forearms' },
  { id: 'abs', label: 'Abs', filterType: 'targetMuscle', filterValue: 'abs' },
  { id: 'lats', label: 'Lats', filterType: 'targetMuscle', filterValue: 'lats' },
  // Row 4: Upper legs
  { id: 'glutes', label: 'Glutes', filterType: 'targetMuscle', filterValue: 'glutes' },
  { id: 'quads', label: 'Quads', filterType: 'targetMuscle', filterValue: 'quads' },
  { id: 'hamstrings', label: 'Hamstrings', filterType: 'targetMuscle', filterValue: 'hamstrings' },
  // Row 5: Lower legs + special
  { id: 'cardio', label: 'Cardio', filterType: 'bodyPart', filterValue: 'cardio' },
  { id: 'calves', label: 'Calves', filterType: 'targetMuscle', filterValue: 'calves' },
  { id: 'show-all', label: 'Show All' },
];

// ============================================================================
// Main Component
// ============================================================================

export default function ExerciseSelectorScreen() {
  const handleMusclePress = useCallback((muscle: MuscleGroup) => {
    if (muscle.id === 'show-all') {
      router.push('/exercise/browser');
    } else if (muscle.filterType && muscle.filterValue) {
      router.push({
        pathname: '/exercise/browser',
        params: {
          filterType: muscle.filterType,
          filterValue: muscle.filterValue,
          filterLabel: muscle.label,
        },
      });
    }
  }, []);

  return (
    <ScreenContainer>
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
              muscleGroupId={muscle.id}
              label={muscle.label}
              onPress={() => handleMusclePress(muscle)}
            />
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface MuscleCardProps {
  muscleGroupId: string;
  label: string;
  onPress: () => void;
}

const MuscleCard = memo(function MuscleCard({ muscleGroupId, label, onPress }: MuscleCardProps) {
  return (
    <Pressable
      className="mb-3 w-[31%] items-center rounded-xl bg-background-surface py-3"
      onPress={onPress}
    >
      <View className="mb-2 h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-background-elevated">
        <MuscleGroupIcon muscleGroupId={muscleGroupId} />
      </View>
      <Text className="text-center text-sm font-medium text-foreground">{label}</Text>
    </Pressable>
  );
});
