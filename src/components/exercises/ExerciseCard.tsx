/**
 * ExerciseCard - Reusable exercise display card
 *
 * Used in: Exercise List, Exercise Picker, Day Details
 */

import { Colors } from '@/constants';
import type { Exercise } from '@/services/database/operations';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export type ExerciseCardMode = 'browse' | 'select';

export interface ExerciseCardProps {
  exercise: Exercise;
  mode?: ExerciseCardMode;
  selected?: boolean;
  onPress: (exercise: Exercise) => void;
}

export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  mode = 'browse',
  selected = false,
  onPress,
}: ExerciseCardProps) {
  const [errorExerciseId, setErrorExerciseId] = useState<string | null>(null);
  const imageError = errorExerciseId === exercise.id;

  const handleImageError = useCallback(() => {
    setErrorExerciseId(exercise.id);
  }, [exercise.id]);

  const handlePress = useCallback(() => {
    onPress(exercise);
  }, [exercise, onPress]);

  // Memoize computed values to avoid re-calculation on re-render
  const displayName = useMemo(() => capitalizeWords(exercise.name), [exercise.name]);
  const muscleText = useMemo(
    () => exercise.target_muscles.map(capitalizeWords).join(', ') || 'No muscle info',
    [exercise.target_muscles]
  );
  const showPlaceholder = !exercise.gif_url || imageError;

  // Memoize checkbox style to avoid object recreation
  const checkboxStyle = useMemo(
    () => ({
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: selected ? Colors.primary.DEFAULT : '#9CA3AF',
      backgroundColor: selected ? Colors.primary.DEFAULT : 'transparent',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    }),
    [selected]
  );

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
            source={{ uri: exercise.gif_url }}
            style={{ width: 56, height: 56 }}
            contentFit="cover"
            autoplay={false}
            cachePolicy="memory-disk"
            transition={200}
            recyclingKey={exercise.id}
            placeholder={{ blurhash: 'L2TSUA~qfQ~qfQfQfQfQfQfQfQfQ' }}
            onError={handleImageError}
          />
        )}
      </View>

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
        <Ionicons name="chevron-forward" size={20} color={Colors.foreground.secondary} />
      ) : (
        <View style={checkboxStyle}>
          {selected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
      )}
    </Pressable>
  );
});
