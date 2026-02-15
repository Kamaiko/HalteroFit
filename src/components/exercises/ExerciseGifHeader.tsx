/**
 * ExerciseGifHeader - Full-width GIF header with gradient transition
 *
 * Displays an exercise GIF with:
 * - Edge-to-edge layout (extends under status bar)
 * - White background
 * - Smooth gradient transition to dark background
 * - Placeholder when GIF unavailable
 *
 * Used in: Exercise Detail, Workout Logging
 */

import { memo, useCallback, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@/components/ui/icon';
import { Colors, ICON_SIZE_3XL } from '@/constants';

// ============================================================================
// Constants
// ============================================================================

/** Base height of the GIF container (excluding safe area) */
const GIF_CONTAINER_HEIGHT = 256;

/** Height of the bottom gradient overlay */
const GRADIENT_HEIGHT = 60;

/**
 * Gradient colors for smooth transition from GIF to dark background.
 * Uses 6 stops for a natural, non-abrupt fade effect.
 * Derived from Colors.background.DEFAULT via hex+alpha (RRGGBBAA format).
 */
const GRADIENT_COLORS = [
  `${Colors.background.DEFAULT}00`, // 0% opacity
  `${Colors.background.DEFAULT}0D`, // ~5% opacity
  `${Colors.background.DEFAULT}26`, // ~15% opacity
  `${Colors.background.DEFAULT}66`, // ~40% opacity
  `${Colors.background.DEFAULT}CC`, // ~80% opacity
  Colors.background.DEFAULT, // 100% opacity
] as const;

/** Distribution of gradient color stops */
const GRADIENT_LOCATIONS = [0, 0.25, 0.45, 0.65, 0.85, 1] as const;

// ============================================================================
// Types
// ============================================================================

export interface ExerciseGifHeaderProps {
  /** URL of the exercise GIF */
  gifUrl: string | null | undefined;
}

// ============================================================================
// Component
// ============================================================================

export const ExerciseGifHeader = memo(function ExerciseGifHeader({
  gifUrl,
}: ExerciseGifHeaderProps) {
  const insets = useSafeAreaInsets();
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const showPlaceholder = !gifUrl || imageError;
  const containerHeight = GIF_CONTAINER_HEIGHT + insets.top;

  return (
    <View
      style={{
        height: containerHeight,
        paddingTop: insets.top,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface.white,
      }}
    >
      {showPlaceholder ? (
        <View className="items-center justify-center">
          <Ionicons
            name="barbell-outline"
            size={ICON_SIZE_3XL}
            color={Colors.foreground.secondary}
          />
        </View>
      ) : (
        <Image
          source={{ uri: gifUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          contentPosition="center"
          autoplay={true}
          cachePolicy="memory-disk"
          onError={handleImageError}
        />
      )}

      {/* Bottom gradient for smooth transition to dark background */}
      <LinearGradient
        colors={[...GRADIENT_COLORS] as [string, string, ...string[]]}
        locations={[...GRADIENT_LOCATIONS] as [number, number, ...number[]]}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: GRADIENT_HEIGHT,
        }}
        pointerEvents="none"
      />
    </View>
  );
});
