/**
 * ExerciseCard - Reusable exercise display card
 *
 * Used in: Exercise List, Exercise Picker, Day Details
 */

import { BORDER_RADIUS_SM, Colors, ICON_SIZE_XS, ICON_SIZE_SM } from '@/constants';
import type { Exercise } from '@/services/database/operations';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ExerciseThumbnail } from '@/components/workout/ExerciseThumbnail';
import { memo, useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';

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
  const handlePress = useCallback(() => {
    onPress(exercise);
  }, [exercise, onPress]);

  const handleImagePress = useCallback(() => {
    onImagePress?.(exercise);
  }, [exercise, onImagePress]);

  const displayName = exercise.name;
  const muscleText = exercise.target_muscles.join(', ') || 'No muscle info';

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
      <ExerciseThumbnail
        imageUrl={exercise.gif_url}
        targetMuscles={exercise.target_muscles}
        exerciseId={exercise.id}
        onPress={onImagePress ? handleImagePress : undefined}
        accessibilityLabel={onImagePress ? `View ${displayName} details` : undefined}
      />

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
