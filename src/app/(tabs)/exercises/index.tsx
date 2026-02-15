/**
 * Exercise Selector Screen (Muscle Selector)
 *
 * Grid of muscle groups for filtering exercises.
 *
 * @see docs/reference/jefit/JEFIT_UI_SPEC.md - Section 2.1 (Muscle Selector)
 */

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

/** Muscle groups mapped to ExerciseDB dataset values */
const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'triceps', label: 'Triceps', filterType: 'targetMuscle', filterValue: 'triceps' },
  { id: 'chest', label: 'Chest', filterType: 'bodyPart', filterValue: 'chest' },
  { id: 'shoulder', label: 'Shoulders', filterType: 'bodyPart', filterValue: 'shoulders' },
  { id: 'biceps', label: 'Biceps', filterType: 'targetMuscle', filterValue: 'biceps' },
  { id: 'abs', label: 'Abs', filterType: 'targetMuscle', filterValue: 'abs' },
  { id: 'back', label: 'Back', filterType: 'bodyPart', filterValue: 'back' },
  { id: 'forearms', label: 'Forearms', filterType: 'targetMuscle', filterValue: 'forearms' },
  { id: 'upper-leg', label: 'Upper Leg', filterType: 'bodyPart', filterValue: 'upper legs' },
  { id: 'glutes', label: 'Glutes', filterType: 'targetMuscle', filterValue: 'glutes' },
  { id: 'cardio', label: 'Cardio', filterType: 'bodyPart', filterValue: 'cardio' },
  { id: 'lower-leg', label: 'Lower Leg', filterType: 'bodyPart', filterValue: 'lower legs' },
  { id: 'show-all', label: 'Show All' },
];

// ============================================================================
// Main Component
// ============================================================================

export default function ExerciseSelectorScreen() {
  const handleMusclePress = (muscle: MuscleGroup) => {
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
  };

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

function MuscleCard({ muscleGroupId, label, onPress }: MuscleCardProps) {
  const isShowAll = muscleGroupId === 'show-all';

  return (
    <Pressable
      className={`mb-3 aspect-square w-[31%] items-center justify-center rounded-xl ${isShowAll ? 'bg-primary' : 'bg-background-surface'}`}
      onPress={onPress}
    >
      <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-background-elevated">
        <MuscleGroupIcon muscleGroupId={muscleGroupId} />
      </View>
      <Text
        className={`text-center text-sm font-medium ${isShowAll ? 'text-white' : 'text-foreground'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
