/**
 * DayExerciseCard - Exercise card for Day Details view
 *
 * Shows exercise name, thumbnail, and target sets/reps.
 * Supports swipe-to-reveal for edit and delete actions.
 */

import { Colors } from '@/constants';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { PlanDayWithExercises } from '@/services/database/operations/plans';
import { capitalizeWords } from '@/utils';
import { Image } from 'expo-image';
import React, { memo, useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

export type DayExercise = PlanDayWithExercises['exercises'][number];

export interface DayExerciseCardProps {
  exercise: DayExercise;
  onPress: (exercise: DayExercise) => void;
  onEdit?: (exercise: DayExercise) => void;
  onDelete?: (exercise: DayExercise) => void;
  drag?: () => void;
  isActive?: boolean;
}

export const DayExerciseCard = memo(function DayExerciseCard({
  exercise,
  onPress,
  onEdit,
  onDelete,
  drag,
  isActive,
}: DayExerciseCardProps) {
  const [imageError, setImageError] = useState(false);
  const swipeableRef = useRef<React.ComponentRef<typeof ReanimatedSwipeable>>(null);

  const handlePress = useCallback(() => {
    onPress(exercise);
  }, [exercise, onPress]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleEdit = useCallback(() => {
    swipeableRef.current?.close();
    onEdit?.(exercise);
  }, [exercise, onEdit]);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    onDelete?.(exercise);
  }, [exercise, onDelete]);

  // Render right swipe actions (Edit + Delete buttons)
  const renderRightActions = useCallback(() => {
    return (
      <View className="mr-4 mb-2 flex-row items-stretch">
        {/* Edit button */}
        <Pressable
          onPress={handleEdit}
          className="w-16 items-center justify-center rounded-l-xl"
          style={{ backgroundColor: Colors.background.elevated }}
        >
          <Ionicons name="pencil-outline" size={24} color={Colors.foreground.DEFAULT} />
        </Pressable>
        {/* Delete button */}
        <Pressable
          onPress={handleDelete}
          className="w-16 items-center justify-center rounded-r-xl"
          style={{ backgroundColor: Colors.danger }}
        >
          <Ionicons name="trash-outline" size={24} color="white" />
        </Pressable>
      </View>
    );
  }, [handleEdit, handleDelete]);

  const showPlaceholder = !exercise.exercise.gif_url || imageError;
  const muscleText =
    exercise.exercise.target_muscles.map(capitalizeWords).join(', ') || 'No muscle info';

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <Pressable
        className="mx-4 mb-2 flex-row items-center rounded-xl bg-background-surface px-4 py-3"
        onPress={handlePress}
        style={isActive ? { transform: [{ scale: 1.02 }], opacity: 0.9 } : undefined}
      >
        {/* Drag Handle */}
        {drag && (
          <Pressable onLongPress={drag} delayLongPress={100} className="mr-1 py-2">
            <View className="items-center justify-center" style={{ width: 12, height: 18 }}>
              {/* 6-dot grid: 2 columns x 3 rows */}
              <View className="flex-row" style={{ gap: 3 }}>
                <View
                  className="rounded-full"
                  style={{ width: 3, height: 3, backgroundColor: Colors.foreground.secondary }}
                />
                <View
                  className="rounded-full"
                  style={{ width: 3, height: 3, backgroundColor: Colors.foreground.secondary }}
                />
              </View>
              <View className="flex-row" style={{ gap: 3, marginTop: 2 }}>
                <View
                  className="rounded-full"
                  style={{ width: 3, height: 3, backgroundColor: Colors.foreground.secondary }}
                />
                <View
                  className="rounded-full"
                  style={{ width: 3, height: 3, backgroundColor: Colors.foreground.secondary }}
                />
              </View>
              <View className="flex-row" style={{ gap: 3, marginTop: 2 }}>
                <View
                  className="rounded-full"
                  style={{ width: 3, height: 3, backgroundColor: Colors.foreground.secondary }}
                />
                <View
                  className="rounded-full"
                  style={{ width: 3, height: 3, backgroundColor: Colors.foreground.secondary }}
                />
              </View>
            </View>
          </Pressable>
        )}

        {/* Thumbnail */}
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
      </Pressable>
    </ReanimatedSwipeable>
  );
});
