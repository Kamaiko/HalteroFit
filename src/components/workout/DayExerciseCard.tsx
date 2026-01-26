/**
 * DayExerciseCard - Exercise card for Day Details view
 *
 * Shows exercise name, thumbnail, and target sets/reps.
 */

import { Colors } from '@/constants';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { PlanDayWithExercises } from '@/services/database/operations/plans';
import { Image } from 'expo-image';
import { memo, useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

type DayExercise = PlanDayWithExercises['exercises'][number];

export interface DayExerciseCardProps {
  exercise: DayExercise;
  onPress: (exercise: DayExercise) => void;
}

export const DayExerciseCard = memo(function DayExerciseCard({
  exercise,
  onPress,
}: DayExerciseCardProps) {
  const [imageError, setImageError] = useState(false);

  const handlePress = useCallback(() => {
    onPress(exercise);
  }, [exercise, onPress]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const showPlaceholder = !exercise.exercise.gif_url || imageError;
  const muscleText =
    exercise.exercise.target_muscles.map(capitalizeWords).join(', ') || 'No muscle info';

  return (
    <Pressable
      className="flex-row items-center border-b border-background-elevated px-4 py-3"
      onPress={handlePress}
    >
      {/* Thumbnail */}
      <View
        className="mr-3 h-14 w-14 items-center justify-center overflow-hidden rounded-lg"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {showPlaceholder ? (
          <View className="h-14 w-14 items-center justify-center bg-white">
            <Ionicons name="barbell-outline" size={24} color={Colors.foreground.secondary} />
          </View>
        ) : (
          <Image
            source={{ uri: exercise.exercise.gif_url }}
            style={{ width: 56, height: 56 }}
            contentFit="cover"
            autoplay={false}
            cachePolicy="memory-disk"
            transition={200}
            onError={handleImageError}
          />
        )}
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="font-medium text-foreground" numberOfLines={1}>
          {capitalizeWords(exercise.exercise.name)}
        </Text>
        <Text className="mt-0.5 text-sm text-foreground-secondary" numberOfLines={1}>
          {muscleText}
        </Text>
        <Text className="mt-0.5 text-sm text-primary">
          {exercise.target_sets} sets × {exercise.target_reps} reps
        </Text>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={Colors.foreground.secondary} />
    </Pressable>
  );
});
