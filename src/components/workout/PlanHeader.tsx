/**
 * PlanHeader - Header component showing active plan info
 *
 * Displays:
 * - Background image (or gradient placeholder)
 * - Plan name
 * - "All Plans" button
 *
 * @see docs/reference/jefit/screenshots/03-plans/13-workout-overview-empty.png
 */

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { CachedImage } from '@/components/ui/cached-image';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Colors, ICON_SIZE_XL } from '@/constants';

interface PlanHeaderProps {
  planName: string;
  coverImageUrl?: string;
}

export const PlanHeader = memo(function PlanHeader({ planName, coverImageUrl }: PlanHeaderProps) {
  const handleAllPlansPress = useCallback(() => {
    // Using href object form for typed navigation
    router.push('/plans' as const);
  }, []);

  return (
    <View className="h-48 relative">
      {/* Background */}
      {coverImageUrl ? (
        <CachedImage
          source={{ uri: coverImageUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      ) : (
        <LinearGradient
          colors={[Colors.primary.DEFAULT, Colors.background.elevated]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: '100%', height: '100%' }}
        />
      )}

      {/* Gradient overlay for text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 100,
        }}
      />

      {/* All Plans Button */}
      <Pressable
        onPress={handleAllPlansPress}
        className="absolute top-4 right-4 bg-white rounded-lg px-3 py-2"
        style={{ minWidth: 80, minHeight: 36 }}
        accessibilityRole="button"
        accessibilityLabel="View all plans"
      >
        <Text className="text-black text-sm font-medium text-center">All Plans</Text>
      </Pressable>

      {/* Plan Name */}
      <View className="absolute bottom-4 left-4 right-20">
        <Text className="text-white text-2xl font-bold" numberOfLines={2}>
          {planName}
        </Text>
      </View>

      {/* Placeholder icon when no cover image */}
      {!coverImageUrl && (
        <View
          className="absolute top-1/2 left-1/2"
          style={{ transform: [{ translateX: -20 }, { translateY: -40 }] }}
        >
          <Ionicons name="barbell-outline" size={ICON_SIZE_XL} color="rgba(255,255,255,0.3)" />
        </View>
      )}
    </View>
  );
});
