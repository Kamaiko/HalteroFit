/**
 * Exercise Selector Screen (Muscle Selector)
 *
 * Grid of muscle groups with "Show All" button.
 * Filters exercises by body part or target muscle.
 *
 * @see docs/reference/jefit/JEFIT_UI_SPEC.md - Section 2.1 (Muscle Selector)
 * @see docs/reference/jefit/screenshots/02-exercises/01-muscle-selector.png
 */

import { Text } from '@/components/ui/text';
import { Ionicons } from '@/components/ui/icon';
import { Colors } from '@/constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Filter type determines which database field to query
type FilterType = 'bodyPart' | 'targetMuscle';

interface MuscleGroup {
  id: string;
  label: string;
  filterType?: FilterType;
  filterValue?: string;
}

// Muscle group data mapped to ExerciseDB dataset values
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

export default function ExerciseSelectorScreen() {
  const handleMusclePress = (muscle: MuscleGroup) => {
    if (muscle.id === 'show-all') {
      router.push('/(tabs)/exercises/list');
    } else if (muscle.filterType && muscle.filterValue) {
      router.push({
        pathname: '/(tabs)/exercises/list',
        params: {
          filterType: muscle.filterType,
          filterValue: muscle.filterValue,
          filterLabel: muscle.label,
        },
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-surface" edges={['top']}>
      <View className="flex-1 bg-background">
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
                isShowAll={muscle.id === 'show-all'}
                onPress={() => handleMusclePress(muscle)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

interface MuscleCardProps {
  label: string;
  isShowAll?: boolean;
  onPress: () => void;
}

function MuscleCard({ label, isShowAll = false, onPress }: MuscleCardProps) {
  return (
    <Pressable
      className="mb-3 aspect-square w-[31%] items-center justify-center rounded-xl"
      style={{
        backgroundColor: isShowAll ? Colors.primary.DEFAULT : Colors.background.surface,
      }}
      onPress={onPress}
    >
      {/* Placeholder for muscle illustration */}
      <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-background-elevated">
        {isShowAll ? (
          <Ionicons name="list" size={24} color={Colors.foreground.DEFAULT} />
        ) : (
          <Ionicons name="body" size={24} color={Colors.foreground.secondary} />
        )}
      </View>

      <Text
        className="text-center text-sm font-medium"
        style={{
          color: isShowAll ? Colors.foreground.inverse : Colors.foreground.DEFAULT,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
