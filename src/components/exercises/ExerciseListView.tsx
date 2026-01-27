/**
 * ExerciseListView - Shared exercise list UI component
 *
 * Provides the common UI structure for exercise browsing and selection:
 * - Header with back button, title, subtitle
 * - Search bar with clear button
 * - Exercise counter
 * - FlashList with loading/empty states
 *
 * Used by: exercise-browser, exercise-picker
 */

import { ScreenContainer } from '@/components/layout';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants';
import type { Exercise } from '@/services/database/operations';
import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, type ReactElement, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

// Memoized loading footer for FlashList
const LoadingFooter = memo(function LoadingFooter() {
  return (
    <View className="py-4">
      <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
    </View>
  );
});

export interface ExerciseListViewProps {
  // Header
  title: string;
  subtitle?: string;
  onBack: () => void;

  // Search
  search: string;
  onSearchChange: (text: string) => void;

  // Data
  exercises: Exercise[];
  totalCount: number;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;

  // Item rendering
  renderItem: (info: { item: Exercise }) => ReactElement;
  extraData?: unknown;

  // Optional content padding for floating buttons
  contentPaddingBottom?: number;

  // Optional floating content (e.g., Add button)
  floatingContent?: ReactNode;
}

export const ExerciseListView = memo(function ExerciseListView({
  title,
  subtitle,
  onBack,
  search,
  onSearchChange,
  exercises,
  totalCount,
  loading,
  loadingMore,
  onLoadMore,
  renderItem,
  extraData,
  contentPaddingBottom = 16,
  floatingContent,
}: ExerciseListViewProps) {
  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center border-b border-background-elevated px-4 py-3">
        <Pressable onPress={onBack} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={Colors.foreground.DEFAULT} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-semibold text-foreground">{title}</Text>
          {subtitle && <Text className="text-sm text-foreground-secondary">{subtitle}</Text>}
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
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={handleClearSearch}>
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
          keyExtractor={(item) => item.id}
          // @ts-expect-error estimatedItemSize improves initial render but FlashList types are outdated
          estimatedItemSize={80}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? LoadingFooter : null}
          extraData={extraData}
          contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
        />
      )}

      {/* Floating content (e.g., Add button) */}
      {floatingContent}
    </ScreenContainer>
  );
});
