/**
 * useDayMenu - Unit tests
 *
 * Tests the delete-day path (data loss risk). Navigation and dialog state
 * are trivial UI wiring — not tested.
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

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
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

  it('deletes day, notifies callback, and clears state', async () => {
    const { result } = renderHook(() => useDayMenu({ onDayDeleted }));
    const day = makePlanDay('day-1', 'Pull Day');

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

  it('calls handleError and resets isDeleting when deletePlanDay rejects', async () => {
    mockDeletePlanDay.mockRejectedValueOnce(new Error('DB locked'));
    const { result } = renderHook(() => useDayMenu({ onDayDeleted }));
    const day = makePlanDay('day-1', 'Pull Day');

    act(() => {
      result.current.handleDayMenuPress(day);
    });

    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    expect(mockHandleError).toHaveBeenCalledTimes(1);
    expect(result.current.isDeleting).toBe(false);
    expect(onDayDeleted).not.toHaveBeenCalled();
  });
});
