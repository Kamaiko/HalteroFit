/**
 * WorkoutScreen - Main workout tab showing active plan
 *
 * Features:
 * - Active plan header with "All Plans" navigation
 * - Tab navigation: Overview / Day Details
 * - Overview: List of plan days with FlashList
 * - Day Details: Exercises for selected day
 * - Auto-creates default plan on first visit
 *
 * Known limitations:
 * - Tabs use Pressable instead of SwipeableTabs (PagerView crash workaround)
 * - Exercise counts hardcoded to 0 (pending Task 2.1.2)
 *
 * @see docs/reference/jefit/screenshots/03-plans/13-workout-overview-empty.png
 * @see docs/reference/jefit/screenshots/03-plans/14-workout-overview-full.png
 * @see docs/PHASE2_AUDIT.md for implementation details
 */

import { FlashList } from '@shopify/flash-list';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DayCard, PlanHeader } from '@/components/workout';
import { Colors } from '@/constants';
import { useErrorHandler } from '@/hooks/ui/useErrorHandler';
import {
  createPlan,
  createPlanDay,
  deletePlanDay,
  getPlanWithDays,
  observeActivePlan,
  type PlanDay,
  type WorkoutPlan,
} from '@/services/database/operations/plans';
import { useAuthStore } from '@/stores/auth/authStore';

export default function WorkoutScreen() {
  const user = useAuthStore((state) => state.user);
  const { handleError } = useErrorHandler();

  // State
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<PlanDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingDefaultPlan, setCreatingDefaultPlan] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Menu state
  const [menuDay, setMenuDay] = useState<PlanDay | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuSheetRef = useRef<BottomSheetRef>(null);

  // TODO(2.1.2): Compute from actual plan_day_exercises data
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});

  // Subscribe to active plan changes
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const subscription = observeActivePlan(user.id).subscribe({
      next: (plan) => {
        setActivePlan(plan);
        if (!plan && !creatingDefaultPlan) {
          // No active plan, create default
          createDefaultPlan();
        } else {
          setLoading(false);
        }
      },
      error: (error) => {
        handleError(error, 'observeActivePlan');
        setLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [user?.id, creatingDefaultPlan, handleError]);

  // Fetch plan days when active plan changes
  useEffect(() => {
    if (!activePlan?.id) {
      setPlanDays([]);
      setSelectedDay(null);
      return;
    }

    const fetchDays = async () => {
      try {
        const planWithDays = await getPlanWithDays(activePlan.id);
        setPlanDays(planWithDays.days);

        // Select first day by default if none selected
        if (planWithDays.days.length > 0 && !selectedDay) {
          // Don't auto-select, let user choose
        }

        // TODO(2.1.2): Query actual exercise counts from plan_day_exercises
        const counts: Record<string, number> = {};
        for (const day of planWithDays.days) {
          counts[day.id] = 0;
        }
        setExerciseCounts(counts);
      } catch (error) {
        handleError(error, 'fetchPlanDays');
      }
    };

    fetchDays();
  }, [activePlan?.id, handleError]);

  // Create default "New Workout" plan
  const createDefaultPlan = useCallback(async () => {
    if (!user?.id || creatingDefaultPlan) return;

    setCreatingDefaultPlan(true);
    try {
      const newPlan = await createPlan({
        user_id: user.id,
        name: 'New Workout',
        is_active: true,
      });

      // Create default first day
      await createPlanDay({
        plan_id: newPlan.id,
        name: 'Workout Day #1',
        day_of_week: 'MON',
        order_index: 0,
      });

      // Plan will be picked up by the observer
    } catch (error) {
      handleError(error, 'createDefaultPlan');
    } finally {
      setCreatingDefaultPlan(false);
      setLoading(false);
    }
  }, [user?.id, creatingDefaultPlan, handleError]);

  // Handle day selection
  const handleDayPress = useCallback((day: PlanDay) => {
    setSelectedDay(day);
    setActiveTabIndex(1); // Switch to Day Details tab
  }, []);

  // Handle day menu press
  const handleDayMenuPress = useCallback((day: PlanDay) => {
    setMenuDay(day);
    menuSheetRef.current?.open();
  }, []);

  // Menu actions
  const handleEditDay = useCallback(() => {
    menuSheetRef.current?.close();
    // TODO: Navigate to edit day screen (Task 2.1.4)
    console.log('Edit day:', menuDay?.id);
  }, [menuDay]);

  const handleDeleteDayPress = useCallback(() => {
    menuSheetRef.current?.close();
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!menuDay) return;

    setIsDeleting(true);
    try {
      await deletePlanDay(menuDay.id);

      // Remove from local state
      setPlanDays((days) => days.filter((d) => d.id !== menuDay.id));

      // Clear selection if deleted day was selected
      if (selectedDay?.id === menuDay.id) {
        setSelectedDay(null);
        setActiveTabIndex(0); // Go back to Overview
      }

      setShowDeleteConfirm(false);
      setMenuDay(null);
    } catch (error) {
      handleError(error, 'deletePlanDay');
    } finally {
      setIsDeleting(false);
    }
  }, [menuDay, selectedDay, handleError]);

  // Handle Add Day press
  const handleAddDayPress = useCallback(() => {
    // TODO: Open Add Day dialog (Task 2.1.6)
    console.log('Add day pressed');
  }, []);

  // Check if Start Workout should be visible
  const canStartWorkout = useMemo(() => {
    if (!selectedDay) return false;
    const count = exerciseCounts[selectedDay.id] ?? 0;
    return count > 0;
  }, [selectedDay, exerciseCounts]);

  // Render day item for FlashList
  const renderDayItem = useCallback(
    ({ item }: { item: PlanDay }) => (
      <DayCard
        day={item}
        exerciseCount={exerciseCounts[item.id] ?? 0}
        isSelected={selectedDay?.id === item.id}
        onPress={handleDayPress}
        onMenuPress={handleDayMenuPress}
      />
    ),
    [exerciseCounts, selectedDay?.id, handleDayPress, handleDayMenuPress]
  );

  const keyExtractor = useCallback((item: PlanDay) => item.id, []);

  // Loading state
  if (loading) {
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        <Text className="text-foreground-secondary mt-4">Loading workout...</Text>
      </ScreenContainer>
    );
  }

  // No user state
  if (!user?.id) {
    return (
      <ScreenContainer contentClassName="items-center justify-center p-6">
        <Text className="text-xl font-bold text-foreground mb-2">Sign In Required</Text>
        <Text className="text-base text-foreground-secondary text-center">
          Please sign in to access your workout plans
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Plan Header */}
      <PlanHeader
        planName={activePlan?.name ?? 'New Workout'}
        coverImageUrl={activePlan?.cover_image_url}
      />

      {/* Tab Bar - Using Pressable tabs (SwipeableTabs disabled due to PagerView crash) */}
      <View className="flex-row border-b border-background-elevated bg-background-surface">
        <Pressable
          className={`flex-1 items-center justify-center py-3 ${activeTabIndex === 0 ? 'border-b-2 border-primary' : ''}`}
          onPress={() => setActiveTabIndex(0)}
        >
          <Text
            className={
              activeTabIndex === 0 ? 'text-primary font-medium' : 'text-foreground-tertiary'
            }
          >
            Overview
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 items-center justify-center py-3 ${activeTabIndex === 1 ? 'border-b-2 border-primary' : ''}`}
          onPress={() => setActiveTabIndex(1)}
        >
          <Text
            className={
              activeTabIndex === 1 ? 'text-primary font-medium' : 'text-foreground-tertiary'
            }
          >
            Day Details
          </Text>
        </Pressable>
      </View>

      {/* Tab Content */}
      {activeTabIndex === 0 ? (
        // Overview Tab
        <View className="flex-1">
          {planDays.length === 0 ? (
            // Empty state
            <View className="flex-1 items-center justify-center p-8">
              <Ionicons name="calendar-outline" size={48} color={Colors.foreground.tertiary} />
              <Text className="text-lg font-semibold text-foreground mt-4">
                No workout days yet
              </Text>
              <Text className="text-sm text-foreground-secondary text-center mt-2">
                Add your first workout day to get started
              </Text>
              <Button className="mt-6" onPress={handleAddDayPress}>
                <Text className="text-white font-medium">+ Add a day</Text>
              </Button>
            </View>
          ) : (
            // Days list
            <FlashList
              data={planDays}
              renderItem={renderDayItem}
              keyExtractor={keyExtractor}
              ListHeaderComponent={<View style={{ height: 12 }} />}
              ListFooterComponent={
                <Pressable onPress={handleAddDayPress} className="flex-row items-center mx-4 py-3">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: Colors.primary.DEFAULT }}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </View>
                  <Text className="text-primary font-medium">Add a day</Text>
                </Pressable>
              }
            />
          )}
        </View>
      ) : (
        // Day Details Tab
        <View className="flex-1">
          {!selectedDay ? (
            // No day selected
            <View className="flex-1 items-center justify-center p-8">
              <Ionicons name="list-outline" size={48} color={Colors.foreground.tertiary} />
              <Text className="text-lg font-semibold text-foreground mt-4">
                Select a workout day
              </Text>
              <Text className="text-sm text-foreground-secondary text-center mt-2">
                Tap on a day in Overview to see its exercises
              </Text>
            </View>
          ) : (
            // Day details - placeholder for Task 2.1.2
            <View className="flex-1 p-4">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-lg font-semibold text-foreground">{selectedDay.name}</Text>
                  <Text className="text-sm text-foreground-secondary">
                    {exerciseCounts[selectedDay.id] ?? 0} exercises
                  </Text>
                </View>
              </View>

              {/* Exercise list placeholder */}
              <View className="flex-1 items-center justify-center">
                <Pressable
                  onPress={() => console.log('Add exercise')}
                  className="bg-background-surface border border-background-elevated rounded-xl p-4 w-full"
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: Colors.primary.DEFAULT + '20' }}
                    >
                      <Ionicons name="add" size={24} color={Colors.primary.DEFAULT} />
                    </View>
                    <View>
                      <Text className="text-base font-medium text-foreground">Add Exercise</Text>
                      <Text className="text-sm text-foreground-secondary">
                        sets x reps • interval
                      </Text>
                    </View>
                  </View>
                </Pressable>
                <Text className="text-sm text-foreground-tertiary mt-4 text-center">
                  Exercise list will be implemented in Task 2.1.2
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Start Workout Button - Fixed at bottom */}
      {canStartWorkout && (
        <View className="absolute bottom-6 right-4">
          <Button
            className="rounded-full px-6 py-3 shadow-lg"
            style={{ backgroundColor: Colors.primary.DEFAULT }}
            onPress={() => console.log('Start workout')}
          >
            <Text className="text-white font-semibold text-base">Start Workout</Text>
          </Button>
        </View>
      )}

      {/* Day Menu Bottom Sheet */}
      <BottomSheet ref={menuSheetRef} title={menuDay?.name ?? 'Options'}>
        <View className="px-4 pb-6">
          <Pressable
            onPress={handleEditDay}
            className="flex-row items-center py-4 border-b border-background-elevated"
          >
            <Ionicons name="pencil-outline" size={24} color={Colors.foreground.DEFAULT} />
            <Text className="text-foreground text-base ml-4">Edit</Text>
          </Pressable>
          <Pressable onPress={handleDeleteDayPress} className="flex-row items-center py-4">
            <Ionicons name="trash-outline" size={24} color={Colors.danger} />
            <Text className="text-base ml-4" style={{ color: Colors.danger }}>
              Delete
            </Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Workout Day?"
        description={`Are you sure you want to delete "${menuDay?.name}"? This will also remove all exercises in this day.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </ScreenContainer>
  );
}
