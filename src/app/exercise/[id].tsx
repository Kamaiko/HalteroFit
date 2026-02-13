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
import { ExerciseGifHeader } from '@/components/exercises';
import { Ionicons } from '@/components/ui/icon';
import { Colors, ICON_SIZE_MD, ICON_SIZE_2XL, SCROLL_THROTTLE_60FPS } from '@/constants';
import { useExerciseDetail } from '@/hooks/exercises';
import { capitalizeWords, stripStepPrefix } from '@/utils';

// ============================================================================
// Constants
// ============================================================================

// Tab configuration (History/Chart tabs disabled until analytics implemented)
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
    <View style={{ flex: 1, backgroundColor: Colors.background.DEFAULT }}>
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
        <View style={{ position: 'relative' }}>
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
        <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24 }}>
          <Text className="text-xl font-bold text-foreground">
            {capitalizeWords(exercise.name)}
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-background-elevated px-4">
          {TABS.map((tab, index) => (
            <Pressable
              key={tab.key}
              style={{ marginRight: index < TABS.length - 1 ? 32 : 0 }}
              className="relative pb-3"
              disabled={tab.disabled}
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
        <View className="p-4">
          {/* Target Muscles Section */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-foreground-secondary">
              Target Muscles
            </Text>
            {exercise.target_muscles[0] && (
              <Text className="text-foreground">
                {capitalizeWords(exercise.target_muscles[0])} (primary)
              </Text>
            )}
            {exercise.secondary_muscles.length > 0 && (
              <Text className="mt-1 text-foreground-secondary">
                {exercise.secondary_muscles.map(capitalizeWords).join(', ')}
              </Text>
            )}
            {exercise.target_muscles.length === 0 && exercise.secondary_muscles.length === 0 && (
              <Text className="text-foreground-tertiary">No muscle information available</Text>
            )}
          </View>

          {/* Equipment Section */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-foreground-secondary">Equipment</Text>
            {exercise.equipments.length > 0 ? (
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {exercise.equipments.map((equipment, index) => (
                  <View key={index} className="rounded-full border border-primary px-3 py-1">
                    <Text className="text-sm text-primary">{capitalizeWords(equipment)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-foreground-tertiary">No equipment needed</Text>
            )}
          </View>

          {/* Instructions Section */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-foreground-secondary">Instructions</Text>
            {exercise.instructions.length > 0 ? (
              <View>
                {exercise.instructions.map((instruction, index) => (
                  <View key={index} className="mb-4 flex-row">
                    <Text className="mr-2 text-foreground-secondary">{index + 1}.</Text>
                    <Text className="flex-1 text-foreground">{stripStepPrefix(instruction)}</Text>
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
