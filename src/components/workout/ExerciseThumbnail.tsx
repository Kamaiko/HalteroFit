/**
 * ExerciseThumbnail - Exercise image with fallback icon
 *
 * Displays an exercise GIF thumbnail or a barbell icon placeholder.
 * Handles image loading errors internally.
 * Optionally wraps in a Pressable for tap-to-view behavior.
 */

import { Colors } from '@/constants';
import { Ionicons } from '@/components/ui/icon';
import { Image } from 'expo-image';
import { memo, useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

export interface ExerciseThumbnailProps {
  imageUrl: string | null | undefined;
  onPress?: () => void;
}

const THUMBNAIL_SIZE = 56; // 14 * 4 = h-14 w-14

export const ExerciseThumbnail = memo(function ExerciseThumbnail({
  imageUrl,
  onPress,
}: ExerciseThumbnailProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const showPlaceholder = !imageUrl || imageError;

  const content = (
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
          source={{ uri: imageUrl }}
          style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}
          contentFit="cover"
          autoplay={false}
          cachePolicy="memory-disk"
          transition={200}
          onError={handleImageError}
        />
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
});
