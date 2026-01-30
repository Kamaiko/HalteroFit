/**
 * useExerciseActions - Unit tests
 *
 * Tests the two-phase delete pattern (animate → DB) and reorder logic.
 * The critical test: deleteExerciseOptimistic must NOT touch the DB.
 */

import { renderHook, act } from '@testing-library/react-native';

import { useExerciseActions } from '@/hooks/workout/useExerciseActions';
import {
  removeExerciseFromPlanDay,
  reorderPlanDayExercises,
} from '@/services/database/operations/plans';

// ── Mocks ──────────────────────────────────────────────────────────────

jest.mock('@/services/database/operations/plans', () => ({
  removeExerciseFromPlanDay: jest.fn(),
  reorderPlanDayExercises: jest.fn(),
}));

const mockHandleError = jest.fn();
jest.mock('@/hooks/ui/useErrorHandler', () => ({
  useErrorHandler: () => ({ handleError: mockHandleError }),
}));

const mockRemove = removeExerciseFromPlanDay as jest.MockedFunction<
  typeof removeExerciseFromPlanDay
>;
const mockReorder = reorderPlanDayExercises as jest.MockedFunction<typeof reorderPlanDayExercises>;

// ── Tests ──────────────────────────────────────────────────────────────

describe('useExerciseActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRemove.mockResolvedValue(undefined as never);
    mockReorder.mockResolvedValue(undefined as never);
  });

  // ── deleteExerciseOptimistic ──────────────────────────────────────

  describe('deleteExerciseOptimistic', () => {
    it('sets deletingExerciseId when called', () => {
      const { result } = renderHook(() => useExerciseActions({ selectedDayId: 'day-1' }));

      act(() => {
        result.current.deleteExerciseOptimistic('ex-1');
      });

      expect(result.current.deletingExerciseId).toBe('ex-1');
    });

    it('does NOT call removeExerciseFromPlanDay (DB deferred to animation complete)', () => {
      const { result } = renderHook(() => useExerciseActions({ selectedDayId: 'day-1' }));

      act(() => {
        result.current.deleteExerciseOptimistic('ex-1');
      });

      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('blocks second delete while one is in progress (guard clause)', () => {
      const { result } = renderHook(() => useExerciseActions({ selectedDayId: 'day-1' }));

      act(() => {
        result.current.deleteExerciseOptimistic('ex-1');
      });
      act(() => {
        result.current.deleteExerciseOptimistic('ex-2');
      });

      // Still the first exercise — second was blocked
      expect(result.current.deletingExerciseId).toBe('ex-1');
    });
  });

  // ── handleDeleteAnimationComplete ─────────────────────────────────

  describe('handleDeleteAnimationComplete', () => {
    it('calls removeExerciseFromPlanDay with the correct exerciseId', async () => {
      const { result } = renderHook(() => useExerciseActions({ selectedDayId: 'day-1' }));

      act(() => {
        result.current.deleteExerciseOptimistic('ex-42');
      });
      await act(async () => {
        await result.current.handleDeleteAnimationComplete();
      });

      expect(mockRemove).toHaveBeenCalledWith('ex-42');
    });

    it('clears deletingExerciseId after completion', async () => {
      const { result } = renderHook(() => useExerciseActions({ selectedDayId: 'day-1' }));

      act(() => {
        result.current.deleteExerciseOptimistic('ex-1');
      });
      await act(async () => {
        await result.current.handleDeleteAnimationComplete();
      });

      expect(result.current.deletingExerciseId).toBeNull();
    });

    it('calls handleError on DB failure and still clears state', async () => {
      const dbError = new Error('DB write failed');
      mockRemove.mockRejectedValueOnce(dbError);

      const { result } = renderHook(() => useExerciseActions({ selectedDayId: 'day-1' }));

      act(() => {
        result.current.deleteExerciseOptimistic('ex-1');
      });
      await act(async () => {
        await result.current.handleDeleteAnimationComplete();
      });

      expect(mockHandleError).toHaveBeenCalledWith(dbError, 'deleteExercise');
      expect(result.current.deletingExerciseId).toBeNull();
    });

    it('does not call DB if deletingExerciseId is null', async () => {
      const { result } = renderHook(() => useExerciseActions({ selectedDayId: 'day-1' }));

      // Call without triggering delete first
      await act(async () => {
        await result.current.handleDeleteAnimationComplete();
      });

      expect(mockRemove).not.toHaveBeenCalled();
    });
  });

  // ── reorderExercisesOptimistic ────────────────────────────────────

  describe('reorderExercisesOptimistic', () => {
    const mockExercises = [
      { id: 'pde-3', exercise: { id: 'ex-3' } },
      { id: 'pde-1', exercise: { id: 'ex-1' } },
      { id: 'pde-2', exercise: { id: 'ex-2' } },
    ] as Parameters<ReturnType<typeof useExerciseActions>['reorderExercisesOptimistic']>[0];

    it('calls reorderPlanDayExercises with correct order_index mapping', async () => {
      const { result } = renderHook(() => useExerciseActions({ selectedDayId: 'day-1' }));

      await act(async () => {
        await result.current.reorderExercisesOptimistic(mockExercises);
      });

      expect(mockReorder).toHaveBeenCalledWith([
        { id: 'pde-3', order_index: 0 },
        { id: 'pde-1', order_index: 1 },
        { id: 'pde-2', order_index: 2 },
      ]);
    });

    it('does nothing if no selectedDayId', async () => {
      const { result } = renderHook(() => useExerciseActions({ selectedDayId: undefined }));

      await act(async () => {
        await result.current.reorderExercisesOptimistic(mockExercises);
      });

      expect(mockReorder).not.toHaveBeenCalled();
    });

    it('calls handleError on failure', async () => {
      const reorderError = new Error('Reorder failed');
      mockReorder.mockRejectedValueOnce(reorderError);

      const { result } = renderHook(() => useExerciseActions({ selectedDayId: 'day-1' }));

      await act(async () => {
        await result.current.reorderExercisesOptimistic(mockExercises);
      });

      expect(mockHandleError).toHaveBeenCalledWith(reorderError, 'reorderExercises');
    });
  });
});
