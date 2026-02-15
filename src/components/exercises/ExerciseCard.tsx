/**
 * ExerciseCard - Reusable exercise display card
 *
 * Used in: Exercise List, Exercise Picker, Day Details
 */

import {
  BORDER_RADIUS_SM,
  Colors,
  ICON_SIZE_XS,
  ICON_SIZE_SM,
  ICON_SIZE_MD,
  THUMBNAIL_SM,
  DURATION_STANDARD,
} from '@/constants';
import type { Exercise } from '@/services/database/operations';
import { getDominantMuscleGroupId } from '@/utils/muscles';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { MuscleGroupIcon } from './MuscleGroupIcon';

export type ExerciseCardMode = 'browse' | 'select';

export interface ExerciseCardProps {
  exercise: Exercise;
  mode?: ExerciseCardMode;
  selected?: boolean;
  onPress: (exercise: Exercise) => void;
  /** Tap on image thumbnail. If provided, the image gets its own tap zone. */
  onImagePress?: (exercise: Exercise) => void;
}

export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  mode = 'browse',
  selected = false,
  onPress,
  onImagePress,
}: ExerciseCardProps) {
  // Track which exercise ID had an image error.
  // When FlashList recycles this component for a different exercise,
  // imageError automatically becomes false (errorExerciseId !== exercise.id).
  // This avoids setState in useEffect while handling recycling correctly.
  const [errorExerciseId, setErrorExerciseId] = useState<string | null>(null);
  const imageError = errorExerciseId === exercise.id;

  const handleImageError = useCallback(() => {
    setErrorExerciseId(exercise.id);
  }, [exercise.id]);

  const handlePress = useCallback(() => {
    onPress(exercise);
  }, [exercise, onPress]);

  const handleImagePress = useCallback(() => {
    onImagePress?.(exercise);
  }, [exercise, onImagePress]);

  const displayName = exercise.name;
  const muscleText = exercise.target_muscles.join(', ') || 'No muscle info';
  const showPlaceholder = !exercise.gif_url || imageError;
  const muscleGroupId = showPlaceholder ? getDominantMuscleGroupId(exercise.target_muscles) : null;

  // Memoize checkbox style to avoid object recreation
  const checkboxStyle = useMemo(
    () => ({
      width: 24,
      height: 24,
      borderRadius: BORDER_RADIUS_SM,
      borderWidth: 2,
      borderColor: selected ? Colors.primary.DEFAULT : Colors.border.input,
      backgroundColor: selected ? Colors.primary.DEFAULT : 'transparent',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    }),
    [selected]
  );

  const accessibilityHint =
    mode === 'browse' ? 'Double tap to view exercise details' : 'Double tap to select exercise';

  return (
    <Pressable
      className="flex-row items-center border-b border-background-elevated px-4 py-3"
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${displayName}, targets ${muscleText}`}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected: mode === 'select' ? selected : undefined }}
    >
      {/* Thumbnail — separate tap zone when onImagePress provided */}
      <Pressable
        className="mr-3 h-14 w-14 items-center justify-center overflow-hidden rounded-lg"
        style={{ backgroundColor: Colors.surface.white }}
        onPress={onImagePress ? handleImagePress : undefined}
        accessibilityRole={onImagePress ? 'button' : undefined}
        accessibilityLabel={onImagePress ? `View ${displayName} details` : undefined}
      >
        {showPlaceholder ? (
          <View className="h-14 w-14 items-center justify-center bg-white">
            {muscleGroupId ? (
              <MuscleGroupIcon muscleGroupId={muscleGroupId} size={THUMBNAIL_SM} variant="light" />
            ) : (
              <Ionicons
                name="barbell-outline"
                size={ICON_SIZE_MD}
                color={Colors.foreground.secondary}
              />
            )}
          </View>
        ) : (
          <Image
            source={{ uri: exercise.gif_url }}
            style={{ width: THUMBNAIL_SM, height: THUMBNAIL_SM }}
            contentFit="cover"
            autoplay={false}
            cachePolicy="memory-disk"
            transition={DURATION_STANDARD}
            recyclingKey={exercise.id}
            placeholder={{ blurhash: 'L2TSUA~qfQ~qfQfQfQfQfQfQfQfQ' }}
            onError={handleImageError}
          />
        )}
      </Pressable>

      {/* Info */}
      <View className="flex-1">
        <Text className="font-medium text-foreground" numberOfLines={1}>
          {displayName}
        </Text>
        <Text className="mt-0.5 text-sm text-foreground-secondary" numberOfLines={1}>
          {muscleText}
        </Text>
      </View>

      {/* Action indicator */}
      {mode === 'browse' ? (
        <Ionicons name="chevron-forward" size={ICON_SIZE_SM} color={Colors.foreground.secondary} />
      ) : (
        <View style={checkboxStyle}>
          {selected && <Ionicons name="checkmark" size={ICON_SIZE_XS} color="white" />}
        </View>
      )}
    </Pressable>
  );
});
