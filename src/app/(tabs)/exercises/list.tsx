/**
 * Exercise List Screen
 *
 * Displays all exercises with search functionality.
 * Uses FlashList for high-performance rendering.
 *
 * @see docs/reference/jefit/JEFIT_UI_SPEC.md - Section 2.2 (Exercise List)
 * @see docs/reference/jefit/screenshots/02-exercises/02-exercise-list.png
 */

import { Text } from '@/components/ui/text';
import { Ionicons } from '@/components/ui/icon';
import { Colors } from '@/constants';
import { ScreenContainer } from '@/components/layout';
import { getExercises, getExerciseCount, type Exercise } from '@/services/database/operations';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { Image } from 'expo-image';

// ============================================================================
// Constants & Helpers
// ============================================================================

const BATCH_SIZE = 50;

/** Capitalize first letter of each word (for ExerciseDB data) */
function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Hoisted static component to prevent recreation on each render
// @see Vercel React Best Practices: rendering-hoist-jsx
const LoadingFooter = () => (
  <View className="py-4">
    <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
  </View>
);

export default function ExerciseListScreen() {
  const params = useLocalSearchParams<{
    filterType?: string;
    filterValue?: string;
    filterLabel?: string;
  }>();
  const { filterType, filterValue, filterLabel } = params;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Build filter options from route params
  const getFilterOptions = useCallback(() => {
    const options: { bodyPart?: string; targetMuscle?: string } = {};
    if (filterType === 'bodyPart' && filterValue) {
      options.bodyPart = filterValue;
    } else if (filterType === 'targetMuscle' && filterValue) {
      options.targetMuscle = filterValue;
    }
    return options;
  }, [filterType, filterValue]);

  // Initial load
  useEffect(() => {
    loadExercises(true);
    loadCount();
  }, [filterType, filterValue]);

  // Search with debounce - parallelize requests for better performance
  // @see Vercel React Best Practices: async-parallel
  useEffect(() => {
    const timer = setTimeout(() => {
      // Run both requests in parallel instead of sequentially
      Promise.all([loadExercises(true), loadCount()]);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const loadCount = async () => {
    try {
      const count = await getExerciseCount({
        search: search.trim() || undefined,
        ...getFilterOptions(),
      });
      setTotalCount(count);
    } catch (error) {
      console.error('Failed to load exercise count:', error);
    }
  };

  const loadExercises = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : exercises.length;
      const results = await getExercises({
        search: search.trim() || undefined,
        ...getFilterOptions(),
        limit: BATCH_SIZE,
        offset,
      });

      if (reset) {
        setExercises(results);
      } else {
        setExercises((prev) => [...prev, ...results]);
      }

      setHasMore(results.length === BATCH_SIZE);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Remove exercises.length from deps - it's not used in the callback
  // @see Vercel React Best Practices: rerender-dependencies
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadExercises(false);
    }
  }, [loadingMore, hasMore, loading]);

  const handleExercisePress = useCallback((exercise: Exercise) => {
    router.push({
      pathname: '/(tabs)/exercises/[id]',
      params: { id: exercise.id },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseCard exercise={item} onPress={() => handleExercisePress(item)} />
    ),
    [handleExercisePress]
  );

  const keyExtractor = useCallback((item: Exercise) => item.id, []);

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center border-b border-background-elevated px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={Colors.foreground.DEFAULT} />
        </Pressable>
        <Text className="flex-1 text-xl font-semibold text-foreground">
          {filterLabel || 'All Exercises'}
        </Text>
      </View>

      {/* Search Bar */}
      <View className="border-b border-background-elevated px-4 py-3">
        <View className="flex-row items-center rounded-lg bg-background-surface px-3 py-2">
          <Ionicons
            name="search"
            size={20}
            color={Colors.foreground.secondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            className="flex-1 text-foreground"
            placeholder="Search exercise name"
            placeholderTextColor={Colors.foreground.tertiary}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close" size={20} color={Colors.foreground.secondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Counter */}
      <View className="px-4 py-2">
        <Text className="text-sm text-foreground-secondary">
          {loading ? 'Loading...' : `${totalCount} exercises found`}
        </Text>
      </View>

      {/* Exercise List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      ) : exercises.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-foreground-secondary">
            {search ? 'No exercises found matching your search' : 'No exercises available'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={exercises}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? LoadingFooter : null}
        />
      )}
    </ScreenContainer>
  );
}

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
}

/**
 * Memoized exercise card component
 * Prevents unnecessary re-renders when scrolling through the list
 * @see Vercel React Best Practices: rerender-memo
 */
const ExerciseCard = memo(function ExerciseCard({ exercise, onPress }: ExerciseCardProps) {
  // Track which exercise.id had an error, not just a boolean
  // This handles FlashList cell recycling: when exercise changes, error state auto-resets
  const [errorExerciseId, setErrorExerciseId] = useState<string | null>(null);

  // Image error only applies if it's for the current exercise
  const imageError = errorExerciseId === exercise.id;

  const handleImageError = useCallback(() => {
    setErrorExerciseId(exercise.id);
  }, [exercise.id]);

  const muscleText = exercise.target_muscles.map(capitalizeWords).join(', ') || 'No muscle info';

  const showPlaceholder = !exercise.gif_url || imageError;

  return (
    <Pressable
      className="flex-row items-center border-b border-background-elevated px-4 py-3"
      onPress={onPress}
    >
      {/* Exercise thumbnail (static, no animation) */}
      <View className="mr-3 h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-background-surface">
        {showPlaceholder ? (
          <View
            style={{
              width: 56,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
            }}
          >
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
            placeholder={{ blurhash: 'L00000fQfQfQfQfQfQfQfQfQfQfQ' }}
            onError={handleImageError}
          />
        )}
      </View>

      {/* Exercise info */}
      <View className="flex-1">
        <Text className="font-medium text-foreground" numberOfLines={1}>
          {capitalizeWords(exercise.name)}
        </Text>
        <Text className="mt-0.5 text-sm text-foreground-secondary" numberOfLines={1}>
          {muscleText}
        </Text>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={Colors.foreground.secondary} />
    </Pressable>
  );
});
