/**
 * EditDayExerciseCard - Exercise card for Edit Day screen
 *
 * Simplified card with inline X button (no swipe actions).
 * Supports drag-to-reorder and thumbnail tap to view exercise detail.
 */

import { Colors, CARD_ACTIVE_STYLE, DURATION_STANDARD } from '@/constants';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { DayExercise } from './DayExerciseCard';
import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { DragHandle } from './DragHandle';
import { ExerciseThumbnail } from './ExerciseThumbnail';

export interface EditDayExerciseCardProps {
  exercise: DayExercise;
  onImagePress: (exercise: DayExercise) => void;
  onRemove: (exercise: DayExercise) => void;
  drag?: () => void;
  isActive?: boolean;
}

export const EditDayExerciseCard = memo(function EditDayExerciseCard({
  exercise,
  onImagePress,
  onRemove,
  drag,
  isActive,
}: EditDayExerciseCardProps) {
  const handleImagePress = useCallback(() => {
    onImagePress(exercise);
  }, [exercise, onImagePress]);

  const handleRemove = useCallback(() => {
    onRemove(exercise);
  }, [exercise, onRemove]);

  return (
    <Animated.View
      entering={FadeIn.duration(DURATION_STANDARD)}
      exiting={FadeOut.duration(DURATION_STANDARD)}
      layout={LinearTransition.duration(DURATION_STANDARD)}
      className="mx-4 mb-2"
    >
      <View
        className="flex-row items-center rounded-xl bg-background-surface px-4 py-3"
        style={isActive ? CARD_ACTIVE_STYLE : undefined}
      >
        {drag && (
          <View style={{ marginLeft: -8, marginRight: 4 }}>
            <DragHandle onDrag={drag} />
          </View>
        )}

        <ExerciseThumbnail imageUrl={exercise.exercise.gif_url} onPress={handleImagePress} />

        {/* Info */}
        <View className="flex-1">
          <Text className="font-medium text-foreground" numberOfLines={1}>
            {exercise.exercise.name}
          </Text>
          <Text className="mt-0.5 text-sm text-primary">
            {exercise.target_sets} sets × {exercise.target_reps} reps
          </Text>
        </View>

        {/* Remove button */}
        <Pressable onPress={handleRemove} hitSlop={8} className="ml-2 active:opacity-60">
          <Ionicons name="close-circle-outline" size={24} color={Colors.foreground.secondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
});
