/**
 * useDayMenu - Day context menu state and actions
 *
 * Manages the bottom sheet menu for editing/deleting workout days.
 * Extracted from useWorkoutScreen for single-responsibility.
 */

import { type RefObject, useCallback, useRef, useState } from 'react';
import { router } from 'expo-router';

import { type BottomSheetRef } from '@/components/ui/bottom-sheet';
import { useErrorHandler } from '@/hooks/ui/useErrorHandler';
import { deletePlanDay, type PlanDay } from '@/services/database/operations/plans';

export interface UseDayMenuReturn {
  menuDay: PlanDay | null;
  showDeleteConfirm: boolean;
  isDeleting: boolean;
  menuSheetRef: RefObject<BottomSheetRef | null>;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDayMenuPress: (day: PlanDay) => void;
  handleEditDay: () => void;
  handleDeleteDayPress: () => void;
  handleConfirmDelete: () => Promise<void>;
}

export function useDayMenu(params: { onDayDeleted: (dayId: string) => void }): UseDayMenuReturn {
  const { handleError } = useErrorHandler();
  const { onDayDeleted } = params;

  const [menuDay, setMenuDay] = useState<PlanDay | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuSheetRef = useRef<BottomSheetRef>(null);

  const handleDayMenuPress = useCallback((day: PlanDay) => {
    setMenuDay(day);
    menuSheetRef.current?.open();
  }, []);

  const handleEditDay = useCallback(() => {
    menuSheetRef.current?.close();
    if (!menuDay) return;
    router.push({ pathname: '/edit-day', params: { dayId: menuDay.id } });
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
    menuSheetRef,
    setShowDeleteConfirm,
    handleDayMenuPress,
    handleEditDay,
    handleDeleteDayPress,
    handleConfirmDelete,
  };
}
