/**
 * Edit Day Screen (Full-screen)
 *
 * Manages exercises within a workout day: rename, reorder (drag-and-drop),
 * add/remove exercises, delete day. All changes are local until "Save" is pressed.
 *
 * Displayed outside tabs (covers entire screen including tab bar).
 *
 * @see docs/reference/jefit/screenshots/03-plans/17-edit-day-empty.png
 * @see docs/reference/jefit/screenshots/03-plans/18-edit-day-full.png
 * @see docs/reference/jefit/screenshots/03-plans/EditDayDragndrop.png
 */

import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, BackHandler, Pressable, TextInput, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { EditDayExerciseCard } from '@/components/workout/EditDayExerciseCard';
import { Colors } from '@/constants';
import { useEditDay } from '@/hooks/workout/useEditDay';
import type { DayExercise } from '@/components/workout/DayExerciseCard';

export default function EditDayScreen() {
  const params = useLocalSearchParams<{ dayId: string }>();
  const { dayId } = params;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const {
    dayName,
    exercises,
    loading,
    isSaving,
    setDayName,
    removeExercise,
    reorderExercises,
    handleSave,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleDeleteDay,
    isDeleting,
    showDiscardConfirm,
    setShowDiscardConfirm,
    handleConfirmDiscard,
    navigateToExercisePicker,
    consumePickerResult,
    navigateToExerciseDetail,
    handleBack,
  } = useEditDay(dayId!);

  // ── Consume picker results on focus ────────────────────────────────────
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      consumePickerResult();
    });
    return unsubscribe;
  }, [navigation, consumePickerResult]);

  // ── Android hardware back button ──────────────────────────────────────
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, [handleBack]);

  const handleRemoveExercise = useCallback(
    (exercise: DayExercise) => {
      removeExercise(exercise.id);
    },
    [removeExercise]
  );

  // ── Render list item ───────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<DayExercise>) => (
      <ScaleDecorator>
        <EditDayExerciseCard
          exercise={item}
          onImagePress={navigateToExerciseDetail}
          onRemove={handleRemoveExercise}
          drag={drag}
          isActive={isActive}
        />
      </ScaleDecorator>
    ),
    [navigateToExerciseDetail, handleRemoveExercise]
  );

  const keyExtractor = useCallback((item: DayExercise) => item.id, []);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View
        className="flex-1 bg-background items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center border-b border-background-elevated px-4 py-3">
        <Pressable onPress={handleBack} className="mr-3" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground.DEFAULT} />
        </Pressable>
        <Text className="flex-1 text-xl font-semibold text-foreground">Edit day</Text>
        <Pressable onPress={handleSave} disabled={isSaving} hitSlop={8}>
          <Text
            className="text-base font-semibold"
            style={{ color: isSaving ? Colors.foreground.tertiary : Colors.primary.DEFAULT }}
          >
            Save
          </Text>
        </Pressable>
      </View>

      {/* Day name input */}
      <View className="mx-4 my-3 flex-row items-center rounded-lg border border-border px-3 py-3">
        <TextInput
          value={dayName}
          onChangeText={setDayName}
          placeholder="Day name"
          placeholderTextColor={Colors.foreground.tertiary}
          className="flex-1 text-base text-foreground"
          style={{ padding: 0 }}
          autoCapitalize="sentences"
          selectTextOnFocus
        />
        <Ionicons name="pencil-outline" size={16} color={Colors.foreground.tertiary} />
      </View>

      {/* Exercise list with drag-to-reorder */}
      <DraggableFlatList
        data={exercises}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onDragEnd={({ data }) => reorderExercises(data)}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 80 + insets.bottom }}
        ListFooterComponent={
          <View>
            {/* Add exercise row */}
            <Pressable
              onPress={navigateToExercisePicker}
              className="mx-4 mb-2 flex-row items-center rounded-xl bg-background-surface px-4 py-3"
            >
              <View className="w-4" />
              <View
                className="mr-3 h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: Colors.primary.DEFAULT + '20' }}
              >
                <Ionicons name="add" size={24} color={Colors.primary.DEFAULT} />
              </View>
              <Text className="text-base font-medium text-foreground">Add exercise</Text>
            </Pressable>

            {/* Delete this day */}
            <Pressable onPress={() => setShowDeleteConfirm(true)} className="items-center py-6">
              <Text className="text-base font-medium text-destructive">Delete this day</Text>
            </Pressable>
          </View>
        }
      />

      {/* Discard changes dialog */}
      <ConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title="Are you sure you want to discard all exercise changes?"
        confirmLabel="Discard"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDiscard}
      />

      {/* Delete day dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete this workout day?"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={handleDeleteDay}
        loading={isDeleting}
      />
    </View>
  );
}
