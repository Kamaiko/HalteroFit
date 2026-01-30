/**
 * EditDayExerciseCard - Exercise card for Edit Day screen
 *
 * Simplified card with inline X button (no swipe actions).
 * Supports drag-to-reorder and thumbnail tap to view exercise detail.
 */

import { Colors } from '@/constants';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { DayExercise } from './DayExerciseCard';
import { capitalizeWords } from '@/utils';
import { Image } from 'expo-image';
import { memo, useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

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
  const [imageError, setImageError] = useState(false);

  const handleImagePress = useCallback(() => {
    onImagePress(exercise);
  }, [exercise, onImagePress]);

  const handleRemove = useCallback(() => {
    onRemove(exercise);
  }, [exercise, onRemove]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const showPlaceholder = !exercise.exercise.gif_url || imageError;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition.duration(200)}
      className="mx-4 mb-2 flex-row items-center rounded-xl bg-background-surface px-4 py-3"
      style={isActive ? { transform: [{ scale: 1.02 }], opacity: 0.9 } : undefined}
    >
      {/* Drag Handle */}
      {drag && (
        <Pressable
          onLongPress={drag}
          delayLongPress={100}
          style={{ marginLeft: -8, marginRight: 4, paddingVertical: 8, paddingHorizontal: 4 }}
        >
          <View className="items-center justify-center" style={{ width: 10, height: 16 }}>
            {/* 6-dot grid: 2 columns x 3 rows */}
            <View className="flex-row" style={{ gap: 2 }}>
              <View
                className="rounded-full"
                style={{ width: 3, height: 3, backgroundColor: Colors.background.elevated }}
              />
              <View
                className="rounded-full"
                style={{ width: 3, height: 3, backgroundColor: Colors.background.elevated }}
              />
            </View>
            <View className="flex-row" style={{ gap: 2, marginTop: 2 }}>
              <View
                className="rounded-full"
                style={{ width: 3, height: 3, backgroundColor: Colors.background.elevated }}
              />
              <View
                className="rounded-full"
                style={{ width: 3, height: 3, backgroundColor: Colors.background.elevated }}
              />
            </View>
            <View className="flex-row" style={{ gap: 2, marginTop: 2 }}>
              <View
                className="rounded-full"
                style={{ width: 3, height: 3, backgroundColor: Colors.background.elevated }}
              />
              <View
                className="rounded-full"
                style={{ width: 3, height: 3, backgroundColor: Colors.background.elevated }}
              />
            </View>
          </View>
        </Pressable>
      )}

      {/* Thumbnail - tappable to view exercise detail */}
      <Pressable onPress={handleImagePress}>
        <View
          className="mr-3 h-14 w-14 items-center justify-center overflow-hidden rounded-lg"
          style={{ backgroundColor: Colors.surface.white }}
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
      </Pressable>

      {/* Info */}
      <View className="flex-1">
        <Text className="font-medium text-foreground" numberOfLines={1}>
          {capitalizeWords(exercise.exercise.name)}
        </Text>
        {/* TODO: Replace summary with per-set editing when workout logging is implemented */}
        <Text className="mt-0.5 text-sm text-primary">
          {exercise.target_sets} sets × {exercise.target_reps} reps
        </Text>
      </View>

      {/* Remove button */}
      <Pressable onPress={handleRemove} hitSlop={8} className="ml-2 active:opacity-60">
        <Ionicons name="close-circle-outline" size={24} color={Colors.foreground.secondary} />
      </Pressable>
    </Animated.View>
  );
});
