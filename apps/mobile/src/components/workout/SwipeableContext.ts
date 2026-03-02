/**
 * SwipeableContext - Shared context for tracking open swipeable card
 *
 * Extracted to its own file to avoid a require cycle between
 * DayExerciseCard (consumer) and WorkoutDayDetailsContent (provider).
 */

import { createContext } from 'react';

export type SetOpenSwipeableId = import('react').Dispatch<
  import('react').SetStateAction<string | null>
>;

export interface SwipeableContextValue {
  openId: string | null;
  setOpenId: SetOpenSwipeableId;
}

export const SwipeableContext = createContext<SwipeableContextValue>({
  openId: null,
  setOpenId: () => {},
});
