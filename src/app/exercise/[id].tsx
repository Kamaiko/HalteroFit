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

import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@/components/ui/icon';
import { Colors } from '@/constants';
import { getExerciseById, type Exercise } from '@/services/database/operations';
import { capitalizeWords } from '@/utils';

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

// ============================================================================
// Main Component
// ============================================================================

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Load exercise data
  useEffect(() => {
    async function loadExercise() {
      if (!id) {
        setError('Exercise ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getExerciseById(id);
        setExercise(data);
      } catch (err) {
        console.error('Failed to load exercise:', err);
        setError('Unable to load exercise details');
      } finally {
        setLoading(false);
      }
    }

    loadExercise();
  }, [id]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !exercise) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
          <Text className="mt-4 text-center text-foreground-secondary">
            {error || 'Exercise not found'}
          </Text>
          <Pressable onPress={handleBack} className="mt-6 rounded-lg bg-primary px-6 py-3">
            <Text className="font-medium text-foreground">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const showPlaceholder = !exercise.gif_url || imageError;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'Colors.surface.white' }} edges={['top']}>
      <View className="flex-1 bg-background">
        {/* Floating Back Button - stays fixed while scrolling */}
        <Pressable
          onPress={handleBack}
          style={{
            position: 'absolute',
            left: 16,
            top: 16,
            zIndex: 20,
          }}
          className="rounded-full bg-black/50 p-2"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.foreground.DEFAULT} />
        </Pressable>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* GIF Section */}
          <View style={{ backgroundColor: 'Colors.surface.white' }}>
            {/* Exercise GIF - white background for seamless blend */}
            <View
              style={{
                height: 256,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'Colors.surface.white',
              }}
            >
              {showPlaceholder ? (
                <View className="items-center justify-center">
                  <Ionicons name="barbell-outline" size={64} color={Colors.foreground.secondary} />
                </View>
              ) : (
                <Image
                  source={{ uri: exercise.gif_url! }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="contain"
                  autoplay={true}
                  cachePolicy="memory-disk"
                  onError={handleImageError}
                />
              )}
            </View>
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
              <Text className="mb-2 text-sm font-medium text-foreground-secondary">
                Instructions
              </Text>
              {exercise.instructions.length > 0 ? (
                <View>
                  {exercise.instructions.map((instruction, index) => (
                    <View key={index} className="mb-4 flex-row">
                      <Text className="mr-2 text-foreground-secondary">{index + 1}.</Text>
                      <Text className="flex-1 text-foreground">{instruction}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-foreground-tertiary">No instructions available</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
