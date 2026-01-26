/**
 * Exercise Picker Screen
 *
 * Full-screen multi-select exercise picker for adding exercises to a workout day.
 *
 * @see docs/reference/jefit/screenshots/02-exercises/06-exercise-picker.png
 */

import { ScreenContainer } from '@/components/layout';
import { ExerciseCard } from '@/components/exercises';
import { Button } from '@/components/ui/button';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants';
import { useExerciseSearch } from '@/hooks/exercises';
import type { Exercise } from '@/services/database/operations';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

const LoadingFooter = () => (
  <View className="py-4">
    <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
  </View>
);

export default function ExercisePickerScreen() {
  const params = useLocalSearchParams<{ dayId?: string; dayName?: string }>();
  const { dayId, dayName } = params;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { exercises, search, setSearch, loading, loadingMore, totalCount, loadMore } =
    useExerciseSearch();

  const handleExercisePress = useCallback((exercise: Exercise) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exercise.id)) {
        next.delete(exercise.id);
      } else {
        next.add(exercise.id);
      }
      return next;
    });
  }, []);

  const handleAddExercises = useCallback(() => {
    if (selectedIds.size === 0 || !dayId) return;

    const selectedExerciseIds = Array.from(selectedIds);
    // TODO: Call addExerciseToPlanDay for each selected exercise
    console.log('Adding exercises to day:', dayId, selectedExerciseIds);
    // Navigate back to Workout tab
    router.replace('/(tabs)/workout');
  }, [selectedIds, dayId]);

  const handleGoBack = useCallback(() => {
    router.replace('/(tabs)/workout');
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseCard
        exercise={item}
        mode="select"
        selected={selectedIds.has(item.id)}
        onPress={handleExercisePress}
      />
    ),
    [selectedIds, handleExercisePress]
  );

  const keyExtractor = useCallback((item: Exercise) => item.id, []);

  const selectedCount = selectedIds.size;

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center border-b border-background-elevated px-4 py-3">
        <Pressable onPress={handleGoBack} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={Colors.foreground.DEFAULT} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-semibold text-foreground">Add Exercises</Text>
          {dayName && <Text className="text-sm text-foreground-secondary">{dayName}</Text>}
        </View>
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? LoadingFooter : null}
          extraData={selectedIds}
          contentContainerStyle={{ paddingBottom: selectedCount > 0 ? 100 : 0 }}
        />
      )}

      {/* Add Button */}
      {selectedCount > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 40,
            left: 16,
            right: 16,
          }}
        >
          <Button
            className="w-full items-center justify-center"
            style={{ backgroundColor: Colors.primary.DEFAULT, minHeight: 56 }}
            onPress={handleAddExercises}
          >
            <Text className="text-white font-semibold text-base">
              Add {selectedCount} exercise{selectedCount !== 1 ? 's' : ''}
            </Text>
          </Button>
        </View>
      )}
    </ScreenContainer>
  );
}
