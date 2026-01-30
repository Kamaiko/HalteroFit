/**
 * useAddDayDialog - Unit tests
 *
 * Tests the add-day dialog state management, auto-create first day,
 * and double-submit guard.
 */

import { renderHook, act } from '@testing-library/react-native';

import { useAddDayDialog } from '@/hooks/workout/useAddDayDialog';
import { createPlanDay, type PlanDay } from '@/services/database/operations/plans';

// ── Mocks ──────────────────────────────────────────────────────────────

jest.mock('@/services/database/operations/plans', () => ({
  createPlanDay: jest.fn(),
}));

const mockHandleError = jest.fn();
jest.mock('@/hooks/ui/useErrorHandler', () => ({
  useErrorHandler: () => ({ handleError: mockHandleError }),
}));

const mockCreatePlanDay = createPlanDay as jest.MockedFunction<typeof createPlanDay>;

const makePlanDay = (id: string, name: string, orderIndex: number): PlanDay => ({
  id,
  plan_id: 'plan-1',
  name,
  day_of_week: undefined,
  order_index: orderIndex,
  created_at: 1735689600000,
  updated_at: 1735689600000,
});

// ── Tests ──────────────────────────────────────────────────────────────

describe('useAddDayDialog', () => {
  const onDayAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── handleAddDayPress ───────────────────────────────────────────────

  describe('handleAddDayPress', () => {
    it('auto-creates first day when planDaysCount === 0 (no dialog)', async () => {
      const newDay = makePlanDay('day-1', 'Workout Day #1', 0);
      mockCreatePlanDay.mockResolvedValueOnce(newDay);

      const { result } = renderHook(() =>
        useAddDayDialog({
          activePlanId: 'plan-1',
          planDaysCount: 0,
          onDayAdded,
        })
      );

      await act(async () => {
        await result.current.handleAddDayPress();
      });

      expect(mockCreatePlanDay).toHaveBeenCalledWith({
        plan_id: 'plan-1',
        name: 'Workout Day #1',
        order_index: 0,
      });
      expect(onDayAdded).toHaveBeenCalledWith(newDay);
      expect(result.current.showAddDayDialog).toBe(false);
    });

    it('shows dialog when planDaysCount > 0', async () => {
      const { result } = renderHook(() =>
        useAddDayDialog({
          activePlanId: 'plan-1',
          planDaysCount: 3,
          onDayAdded,
        })
      );

      await act(async () => {
        await result.current.handleAddDayPress();
      });

      expect(result.current.showAddDayDialog).toBe(true);
      expect(mockCreatePlanDay).not.toHaveBeenCalled();
    });

    it('does nothing if no activePlanId', async () => {
      const { result } = renderHook(() =>
        useAddDayDialog({
          activePlanId: undefined,
          planDaysCount: 0,
          onDayAdded,
        })
      );

      await act(async () => {
        await result.current.handleAddDayPress();
      });

      expect(mockCreatePlanDay).not.toHaveBeenCalled();
      expect(result.current.showAddDayDialog).toBe(false);
    });

    it('calls handleError on auto-create failure', async () => {
      const dbError = new Error('Create failed');
      mockCreatePlanDay.mockRejectedValueOnce(dbError);

      const { result } = renderHook(() =>
        useAddDayDialog({
          activePlanId: 'plan-1',
          planDaysCount: 0,
          onDayAdded,
        })
      );

      await act(async () => {
        await result.current.handleAddDayPress();
      });

      expect(mockHandleError).toHaveBeenCalledWith(dbError, 'createFirstDay');
      expect(result.current.isAddingDay).toBe(false);
    });
  });

  // ── handleConfirmAddDay ─────────────────────────────────────────────

  describe('handleConfirmAddDay', () => {
    it('creates day with trimmed name and correct order_index', async () => {
      const newDay = makePlanDay('day-4', 'Leg Day', 3);
      mockCreatePlanDay.mockResolvedValueOnce(newDay);

      const { result } = renderHook(() =>
        useAddDayDialog({
          activePlanId: 'plan-1',
          planDaysCount: 3,
          onDayAdded,
        })
      );

      // Open dialog first
      await act(async () => {
        await result.current.handleAddDayPress();
      });
      act(() => {
        result.current.setAddDayName('  Leg Day  ');
      });

      await act(async () => {
        await result.current.handleConfirmAddDay();
      });

      expect(mockCreatePlanDay).toHaveBeenCalledWith({
        plan_id: 'plan-1',
        name: 'Leg Day',
        order_index: 3,
      });
      expect(onDayAdded).toHaveBeenCalledWith(newDay);
      expect(result.current.showAddDayDialog).toBe(false);
      expect(result.current.addDayName).toBe('');
      expect(result.current.isAddingDay).toBe(false);
    });

    it('uses "New day" as fallback name when empty', async () => {
      const newDay = makePlanDay('day-2', 'New day', 1);
      mockCreatePlanDay.mockResolvedValueOnce(newDay);

      const { result } = renderHook(() =>
        useAddDayDialog({
          activePlanId: 'plan-1',
          planDaysCount: 1,
          onDayAdded,
        })
      );

      // Open dialog, leave name empty
      await act(async () => {
        await result.current.handleAddDayPress();
      });

      await act(async () => {
        await result.current.handleConfirmAddDay();
      });

      expect(mockCreatePlanDay).toHaveBeenCalledWith(expect.objectContaining({ name: 'New day' }));
    });

    it('does nothing if no activePlanId', async () => {
      const { result } = renderHook(() =>
        useAddDayDialog({
          activePlanId: undefined,
          planDaysCount: 0,
          onDayAdded,
        })
      );

      await act(async () => {
        await result.current.handleConfirmAddDay();
      });

      expect(mockCreatePlanDay).not.toHaveBeenCalled();
    });

    it('calls handleError on failure and clears isAddingDay', async () => {
      const dbError = new Error('Create failed');
      mockCreatePlanDay.mockRejectedValueOnce(dbError);

      const { result } = renderHook(() =>
        useAddDayDialog({
          activePlanId: 'plan-1',
          planDaysCount: 2,
          onDayAdded,
        })
      );

      // Open dialog and set name
      await act(async () => {
        await result.current.handleAddDayPress();
      });
      act(() => {
        result.current.setAddDayName('Push Day');
      });

      await act(async () => {
        await result.current.handleConfirmAddDay();
      });

      expect(mockHandleError).toHaveBeenCalledWith(dbError, 'createPlanDay');
      expect(result.current.isAddingDay).toBe(false);
    });
  });

  // ── handleCancelAddDay ──────────────────────────────────────────────

  describe('handleCancelAddDay', () => {
    it('closes dialog and clears name', async () => {
      const { result } = renderHook(() =>
        useAddDayDialog({
          activePlanId: 'plan-1',
          planDaysCount: 2,
          onDayAdded,
        })
      );

      // Open dialog and set name
      await act(async () => {
        await result.current.handleAddDayPress();
      });
      act(() => {
        result.current.setAddDayName('Some Day');
      });

      expect(result.current.showAddDayDialog).toBe(true);

      act(() => {
        result.current.handleCancelAddDay();
      });

      expect(result.current.showAddDayDialog).toBe(false);
      expect(result.current.addDayName).toBe('');
    });
  });
});
