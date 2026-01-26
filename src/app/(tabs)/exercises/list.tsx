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
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants';
import { getExercises, getExerciseCount, type Exercise } from '@/services/database/operations';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BATCH_SIZE = 50;

export default function ExerciseListScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Initial load
  useEffect(() => {
    loadExercises(true);
    loadCount();
  }, []);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadExercises(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const loadCount = async () => {
    try {
      const count = await getExerciseCount();
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

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadExercises(false);
    }
  }, [loadingMore, hasMore, loading, exercises.length]);

  const handleExercisePress = useCallback((exercise: Exercise) => {
    // Future: Navigate to exercise detail
    // router.push(`/exercises/${exercise.id}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseCard exercise={item} onPress={() => handleExercisePress(item)} />
    ),
    [handleExercisePress]
  );

  const keyExtractor = useCallback((item: Exercise) => item.id, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center border-b border-background-elevated px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-2xl">←</Text>
        </Pressable>
        <Text className="flex-1 text-xl font-semibold text-foreground">Exercises</Text>
      </View>

      {/* Search Bar */}
      <View className="border-b border-background-elevated px-4 py-3">
        <View className="flex-row items-center rounded-lg bg-background-surface px-3 py-2">
          <Text className="mr-2 text-foreground-tertiary">🔍</Text>
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
              <Text className="text-foreground-tertiary">✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Counter */}
      <View className="px-4 py-2">
        <Text className="text-sm text-foreground-secondary">
          {loading ? 'Loading...' : `${exercises.length} of ${totalCount} exercises`}
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
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4">
                <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
}

function ExerciseCard({ exercise, onPress }: ExerciseCardProps) {
  const muscleText = exercise.target_muscles.join(', ') || 'No muscle info';

  return (
    <Pressable
      className="flex-row items-center border-b border-background-elevated px-4 py-3"
      onPress={onPress}
    >
      {/* Placeholder for exercise image/gif */}
      <View className="mr-3 h-14 w-14 items-center justify-center rounded-lg bg-background-surface">
        <Text className="text-2xl">💪</Text>
      </View>

      {/* Exercise info */}
      <View className="flex-1">
        <Text className="font-medium text-foreground" numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text className="mt-0.5 text-sm text-foreground-secondary" numberOfLines={1}>
          {muscleText}
        </Text>
      </View>

      {/* Chevron */}
      <Text className="text-foreground-tertiary">›</Text>
    </Pressable>
  );
}
