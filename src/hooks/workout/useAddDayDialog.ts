/**
 * useAddDayDialog - Add day dialog state and actions
 *
 * Manages the dialog for adding new workout days to a plan.
 * Extracted from useWorkoutScreen for single-responsibility.
 */

import { useCallback, useState } from 'react';

import { useAlertState, type AlertState } from '@/hooks/ui/useAlertState';
import { useErrorHandler } from '@/hooks/ui/useErrorHandler';
import { createPlanDay, type PlanDay } from '@/services/database/operations/plans';
import { getDayCountError } from '@/utils/validators';

export interface UseAddDayDialogReturn {
  showAddDayDialog: boolean;
  addDayName: string;
  setAddDayName: (name: string) => void;
  isAddingDay: boolean;
  handleAddDayPress: () => Promise<void>;
  handleConfirmAddDay: () => Promise<void>;
  handleCancelAddDay: () => void;
  alert: AlertState | null;
  clearAlert: () => void;
}

export function useAddDayDialog(params: {
  activePlanId: string | undefined;
  planDaysCount: number;
  onDayAdded: (day: PlanDay) => void;
}): UseAddDayDialogReturn {
  const { handleError } = useErrorHandler();
  const { activePlanId, planDaysCount, onDayAdded } = params;

  const [showAddDayDialog, setShowAddDayDialog] = useState(false);
  const [addDayName, setAddDayName] = useState('');
  const [isAddingDay, setIsAddingDay] = useState(false);
  const { alert, setAlert, clearAlert } = useAlertState();

  const handleAddDayPress = useCallback(async () => {
    if (!activePlanId) return;

    // Check max days limit
    const dayCountError = getDayCountError(planDaysCount);
    if (dayCountError) {
      setAlert(dayCountError);
      return;
    }

    // Empty state: auto-create first day without dialog
    if (planDaysCount === 0) {
      setIsAddingDay(true);
      try {
        const newDay = await createPlanDay({
          plan_id: activePlanId,
          name: 'Workout Day #1',
          order_index: 0,
        });
        // Observable will auto-update planDays. Notify parent to select it.
        onDayAdded(newDay);
      } catch (error) {
        handleError(error, 'createFirstDay');
      } finally {
        setIsAddingDay(false);
      }
      return;
    }

    // Normal: show dialog
    setAddDayName('');
    setShowAddDayDialog(true);
  }, [activePlanId, planDaysCount, onDayAdded, handleError, setAlert]);

  const handleConfirmAddDay = useCallback(async () => {
    if (!activePlanId || isAddingDay) return;

    // Defense in depth: check limit even if dialog is already open
    const dayCountError = getDayCountError(planDaysCount);
    if (dayCountError) {
      setAlert(dayCountError);
      setShowAddDayDialog(false);
      return;
    }

    const name = addDayName.trim() || 'New day';
    setIsAddingDay(true);
    try {
      const newDay = await createPlanDay({
        plan_id: activePlanId,
        name,
        order_index: planDaysCount,
      });
      // Observable will auto-update planDays. Notify parent to select it.
      onDayAdded(newDay);
      setShowAddDayDialog(false);
      setAddDayName('');
    } catch (error) {
      handleError(error, 'createPlanDay');
    } finally {
      setIsAddingDay(false);
    }
  }, [activePlanId, addDayName, planDaysCount, isAddingDay, onDayAdded, handleError, setAlert]);

  const handleCancelAddDay = useCallback(() => {
    setShowAddDayDialog(false);
    setAddDayName('');
  }, []);

  return {
    showAddDayDialog,
    addDayName,
    setAddDayName,
    isAddingDay,
    handleAddDayPress,
    handleConfirmAddDay,
    handleCancelAddDay,
    alert,
    clearAlert,
  };
}
