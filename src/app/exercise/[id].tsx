/**
 * Exercise Detail Screen (Full-screen)
 *
 * Displays detailed information about an exercise including:
 * - Animated GIF demonstration
 * - Target and secondary muscles
 * - Equipment needed
 * - Step-by-step instructions
 *
 * Displayed outside tabs (covers entire screen including tab bar).
 *
 * @see docs/reference/jefit/screenshots/Description_exercice1.png
 * @see docs/reference/jefit/screenshots/Description_exercice2.png
 */

import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Chip } from '@/components/ui';
import { ExerciseGifHeader, MuscleHighlighter } from '@/components/exercises';
import { Ionicons } from '@/components/ui/icon';
import {
  Colors,
  BORDER_RADIUS_LG,
  ICON_SIZE_MD,
  ICON_SIZE_2XL,
  SCROLL_THROTTLE_60FPS,
} from '@/constants';
import { useExerciseDetail } from '@/hooks/exercises';

// ============================================================================
// Constants
// ============================================================================

// Tab configuration — only Guide tab is active
const TABS = [
  { key: 'history', label: 'History', disabled: true },
  { key: 'chart', label: 'Chart', disabled: true },
  { key: 'guide', label: 'Guide', disabled: false },
] as const;

// Currently only Guide tab is active
const ACTIVE_TAB: (typeof TABS)[number]['key'] = 'guide';

// Scroll distance before fade begins (dead zone)
const GIF_FADE_DELAY = 30;

// Distance in pixels over which the GIF fades out after the delay (ease-in curve)
const GIF_FADE_DISTANCE = 150;

// ============================================================================
// Main Component
// ============================================================================

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { exercise, loading, error, handleBack } = useExerciseDetail(id);

  // Scroll-based fade animation for GIF section
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Overlay that fades IN (0 → 1) with delayed ease-in curve
  const overlayFadeStyle = useAnimatedStyle(() => {
    'worklet';
    const adjusted = Math.max(scrollY.value - GIF_FADE_DELAY, 0);
    const progress = Math.min(adjusted / GIF_FADE_DISTANCE, 1);
    return { opacity: progress * progress };
  });

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      </View>
    );
  }

  // Error state
  if (error || !exercise) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={ICON_SIZE_2XL} color={Colors.destructive} />
          <Text className="mt-4 text-center text-foreground-secondary">
            {error || 'Exercise not found'}
          </Text>
          <Pressable onPress={handleBack} className="mt-6 rounded-lg bg-primary px-6 py-3">
            <Text className="font-medium text-foreground">Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Floating Back Button - stays fixed while scrolling, respects safe area */}
      <Pressable
        onPress={handleBack}
        style={{
          position: 'absolute',
          left: 16,
          top: insets.top + 8,
          zIndex: 20,
        }}
        className="rounded-full bg-black/50 p-2"
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={ICON_SIZE_MD} color={Colors.foreground.DEFAULT} />
      </Pressable>

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={SCROLL_THROTTLE_60FPS}
      >
        {/* GIF Section - edge-to-edge with overlay fade */}
        <View className="relative">
          <ExerciseGifHeader gifUrl={exercise.gif_url} />
          {/* Overlay that fades in to cover GIF uniformly */}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: Colors.background.DEFAULT,
              },
              overlayFadeStyle,
            ]}
          />
        </View>

        {/* Exercise Title - Below GIF */}
        <View className="px-4 pt-6 pb-6">
          <Text className="text-xl font-bold text-foreground">{exercise.name}</Text>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-8 border-b border-background-elevated px-4">
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              className="relative pb-3"
              disabled={tab.disabled}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab.key === ACTIVE_TAB, disabled: tab.disabled }}
            >
              <Text
                className={
                  tab.key === ACTIVE_TAB
                    ? 'text-base font-medium text-primary'
                    : tab.disabled
                      ? 'text-base text-foreground-tertiary'
                      : 'text-base text-foreground-secondary'
                }
              >
                {tab.label}
              </Text>
              {tab.key === ACTIVE_TAB && (
                <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </Pressable>
          ))}
        </View>

        {/* Guide Content */}
        <View className="px-4 pt-4">
          {/* Target Muscles Section */}
          <View className="mb-6">
            <Text variant="sectionLabel">Target Muscles</Text>
            {exercise.target_muscles.length > 0 || exercise.secondary_muscles.length > 0 ? (
              <View className="flex-row flex-wrap gap-y-2">
                {exercise.target_muscles.map((muscle) => (
                  <View key={muscle} className="w-1/2 flex-row items-center">
                    <View
                      className="mr-2 h-4 w-[3px] rounded-full"
                      style={{ backgroundColor: Colors.primary.DEFAULT }}
                    />
                    <Text className="text-sm text-foreground">{muscle}</Text>
                  </View>
                ))}
                {exercise.secondary_muscles.map((muscle) => (
                  <View key={`s-${muscle}`} className="w-1/2 flex-row items-center">
                    <View
                      className="mr-2 h-4 w-[3px] rounded-full"
                      style={{ backgroundColor: Colors.primary.muted }}
                    />
                    <Text className="text-sm text-foreground-secondary">{muscle}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-foreground-tertiary">No muscle information available</Text>
            )}
          </View>

          {/* Muscle Visualization */}
          <MuscleHighlighter
            targetMuscles={exercise.target_muscles}
            secondaryMuscles={exercise.secondary_muscles}
          />

          {/* Equipment Section */}
          <View className="mb-6">
            <Text variant="sectionLabel">Equipment</Text>
            {exercise.equipments.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {exercise.equipments.map((equipment) => (
                  <Chip key={equipment} label={equipment} />
                ))}
              </View>
            ) : (
              <Text className="text-foreground-tertiary">No equipment needed</Text>
            )}
          </View>

          {/* Instructions Section */}
          <View className="mb-4 rounded-xl bg-background-surface p-4">
            <Text variant="sectionLabel" className="mb-3">
              Instructions
            </Text>
            {exercise.instructions.length > 0 ? (
              <View>
                {exercise.instructions.map((instruction, index) => (
                  <View key={index} className="mb-4 flex-row">
                    <View
                      className="mr-3 h-6 w-6 items-center justify-center bg-primary/20"
                      style={{ borderRadius: BORDER_RADIUS_LG }}
                    >
                      <Text className="text-xs font-semibold text-primary">{index + 1}</Text>
                    </View>
                    <Text className="flex-1 pt-0.5 text-foreground">{instruction}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-foreground-tertiary">No instructions available</Text>
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
