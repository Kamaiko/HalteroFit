/**
 * useDayMenu - Day context menu state and actions
 *
 * Manages the bottom sheet menu for editing/deleting workout days.
 * Extracted from useWorkoutScreen for single-responsibility.
 */

import { type RefObject, useCallback, useState } from 'react';
import { router } from 'expo-router';

import { type BottomSheetRef } from '@/components/ui/bottom-sheet';
import { useErrorHandler } from '@/hooks/ui/useErrorHandler';
import { deletePlanDay, type PlanDay } from '@/services/database/operations/plans';

export interface UseDayMenuParams {
  onDayDeleted: (dayId: string) => void;
  /** Ref owned by the compositor — useDayMenu uses it in handlers but doesn't create it */
  sheetRef: RefObject<BottomSheetRef | null>;
}

export interface UseDayMenuReturn {
  menuDay: PlanDay | null;
  showDeleteConfirm: boolean;
  isDeleting: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDayMenuPress: (day: PlanDay) => void;
  handleEditDay: () => void;
  handleDeleteDayPress: () => void;
  handleConfirmDelete: () => Promise<void>;
}

export function useDayMenu(params: UseDayMenuParams): UseDayMenuReturn {
  const { handleError } = useErrorHandler();
  const { onDayDeleted, sheetRef: menuSheetRef } = params;

  const [menuDay, setMenuDay] = useState<PlanDay | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDayMenuPress = useCallback((day: PlanDay) => {
    setMenuDay(day);
    menuSheetRef.current?.open();
  }, []);

  const handleEditDay = useCallback(() => {
    menuSheetRef.current?.close();
    if (!menuDay) return;
    router.push({ pathname: '/plans/edit-day', params: { dayId: menuDay.id } });
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
      // Observable will auto-update planDays list.
      // Notify parent to clear selection if needed.
      onDayDeleted(menuDay.id);
      setShowDeleteConfirm(false);
      setMenuDay(null);
    } catch (error) {
      handleError(error, 'deletePlanDay');
    } finally {
      setIsDeleting(false);
    }
  }, [menuDay, onDayDeleted, handleError]);

  return {
    menuDay,
    showDeleteConfirm,
    isDeleting,
    setShowDeleteConfirm,
    handleDayMenuPress,
    handleEditDay,
    handleDeleteDayPress,
    handleConfirmDelete,
  };
}
