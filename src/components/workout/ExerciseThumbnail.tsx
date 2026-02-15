/**
 * ExerciseThumbnail - Exercise image with fallback icon
 *
 * Displays an exercise GIF thumbnail, a muscle group SVG placeholder
 * (when target muscles are known), or a barbell icon fallback.
 * Handles image loading errors internally.
 * Optionally wraps in a Pressable for tap-to-view behavior.
 *
 * Supports FlashList recycling via exerciseId prop: when a component is
 * recycled for a different exercise, the error state auto-resets.
 */

import { Colors, DURATION_STANDARD, ICON_SIZE_MD, THUMBNAIL_SM } from '@/constants';
import { MuscleGroupIcon } from '@/components/exercises/MuscleGroupIcon';
import { Ionicons } from '@/components/ui/icon';
import { getDominantMuscleGroupId } from '@/utils/muscles';
import { Image } from 'expo-image';
import { memo, useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

export interface ExerciseThumbnailProps {
  imageUrl: string | null | undefined;
  /** Target muscles for SVG placeholder when no GIF available */
  targetMuscles?: string[];
  /** Exercise ID for recycling-aware error handling (FlashList) */
  exerciseId?: string;
  onPress?: () => void;
  /** Accessibility label for the thumbnail tap target */
  accessibilityLabel?: string;
}

export const ExerciseThumbnail = memo(function ExerciseThumbnail({
  imageUrl,
  targetMuscles,
  exerciseId,
  onPress,
  accessibilityLabel,
}: ExerciseThumbnailProps) {
  // When exerciseId is provided (FlashList context), track which ID had the error.
  // On recycle, errorId !== new exerciseId → imageError auto-resets to false.
  // Without exerciseId, falls back to simple boolean error tracking.
  const [errorId, setErrorId] = useState<string | null>(null);
  const imageError = exerciseId ? errorId === exerciseId : !!errorId;

  const handleImageError = useCallback(() => {
    setErrorId(exerciseId ?? 'error');
  }, [exerciseId]);

  const showPlaceholder = !imageUrl || imageError;
  const muscleGroupId =
    showPlaceholder && targetMuscles ? getDominantMuscleGroupId(targetMuscles) : null;

  const content = (
    <View
      className="mr-3 h-14 w-14 items-center justify-center overflow-hidden rounded-lg"
      style={{ backgroundColor: Colors.surface.white }}
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
          source={{ uri: imageUrl }}
          style={{ width: THUMBNAIL_SM, height: THUMBNAIL_SM }}
          contentFit="cover"
          autoplay={false}
          cachePolicy="memory-disk"
          transition={DURATION_STANDARD}
          recyclingKey={exerciseId}
          onError={handleImageError}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {content}
      </Pressable>
    );
  }

  return content;
});
