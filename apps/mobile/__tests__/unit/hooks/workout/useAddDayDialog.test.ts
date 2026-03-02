/**
 * useAddDayDialog - Unit tests
 *
 * Tests the two creation paths: auto-create first day (no dialog)
 * and confirm-add with trimmed name. Both are data-write paths.
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
});
