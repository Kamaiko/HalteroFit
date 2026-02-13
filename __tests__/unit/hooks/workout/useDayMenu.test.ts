/**
 * useDayMenu - Unit tests
 *
 * Tests the bottom sheet menu for editing/deleting workout days.
 */

import { renderHook, act } from '@testing-library/react-native';

import { useDayMenu } from '@/hooks/workout/useDayMenu';
import { deletePlanDay, type PlanDay } from '@/services/database/operations/plans';

// ── Mocks ──────────────────────────────────────────────────────────────

jest.mock('@/services/database/operations/plans', () => ({
  deletePlanDay: jest.fn(),
}));

const mockHandleError = jest.fn();
jest.mock('@/hooks/ui/useErrorHandler', () => ({
  useErrorHandler: () => ({ handleError: mockHandleError }),
}));

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
}));

const mockDeletePlanDay = deletePlanDay as jest.MockedFunction<typeof deletePlanDay>;

const makePlanDay = (id: string, name: string): PlanDay => ({
  id,
  plan_id: 'plan-1',
  name,
  day_of_week: undefined,
  order_index: 0,
  created_at: 1735689600000,
  updated_at: 1735689600000,
});

// ── Tests ──────────────────────────────────────────────────────────────

describe('useDayMenu', () => {
  const onDayDeleted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeletePlanDay.mockResolvedValue(undefined as never);
  });

  // ── handleDayMenuPress ────────────────────────────────────────────

  describe('handleDayMenuPress', () => {
    it('sets menuDay to the pressed day', () => {
      const { result } = renderHook(() => useDayMenu({ onDayDeleted }));
      const day = makePlanDay('day-1', 'Leg Day');

      act(() => {
        result.current.handleDayMenuPress(day);
      });

      expect(result.current.menuDay).toEqual(day);
    });
  });

  // ── handleEditDay ─────────────────────────────────────────────────

  describe('handleEditDay', () => {
    it('navigates to /plans/edit-day with menuDay.id', () => {
      const { result } = renderHook(() => useDayMenu({ onDayDeleted }));
      const day = makePlanDay('day-42', 'Push Day');

      act(() => {
        result.current.handleDayMenuPress(day);
      });
      act(() => {
        result.current.handleEditDay();
      });

      expect(mockRouterPush).toHaveBeenCalledWith({
        pathname: '/plans/edit-day',
        params: { dayId: 'day-42' },
      });
    });

    it('does nothing if menuDay is null', () => {
      const { result } = renderHook(() => useDayMenu({ onDayDeleted }));

      act(() => {
        result.current.handleEditDay();
      });

      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  // ── handleDeleteDayPress ──────────────────────────────────────────

  describe('handleDeleteDayPress', () => {
    it('shows delete confirm dialog', () => {
      const { result } = renderHook(() => useDayMenu({ onDayDeleted }));

      act(() => {
        result.current.handleDeleteDayPress();
      });

      expect(result.current.showDeleteConfirm).toBe(true);
    });
  });

  // ── handleConfirmDelete ───────────────────────────────────────────

  describe('handleConfirmDelete', () => {
    it('calls deletePlanDay, notifies onDayDeleted, and clears state', async () => {
      const { result } = renderHook(() => useDayMenu({ onDayDeleted }));
      const day = makePlanDay('day-1', 'Pull Day');

      // Set up menu state
      act(() => {
        result.current.handleDayMenuPress(day);
      });

      await act(async () => {
        await result.current.handleConfirmDelete();
      });

      expect(mockDeletePlanDay).toHaveBeenCalledWith('day-1');
      expect(onDayDeleted).toHaveBeenCalledWith('day-1');
      expect(result.current.showDeleteConfirm).toBe(false);
      expect(result.current.menuDay).toBeNull();
      expect(result.current.isDeleting).toBe(false);
    });

    it('calls handleError on failure', async () => {
      const dbError = new Error('Delete failed');
      mockDeletePlanDay.mockRejectedValueOnce(dbError);

      const { result } = renderHook(() => useDayMenu({ onDayDeleted }));
      const day = makePlanDay('day-1', 'Leg Day');

      act(() => {
        result.current.handleDayMenuPress(day);
      });

      await act(async () => {
        await result.current.handleConfirmDelete();
      });

      expect(mockHandleError).toHaveBeenCalledWith(dbError, 'deletePlanDay');
      expect(result.current.isDeleting).toBe(false);
    });

    it('does nothing if menuDay is null', async () => {
      const { result } = renderHook(() => useDayMenu({ onDayDeleted }));

      await act(async () => {
        await result.current.handleConfirmDelete();
      });

      expect(mockDeletePlanDay).not.toHaveBeenCalled();
    });
  });
});
