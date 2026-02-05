/**
 * useAlertState - Reusable alert dialog state management
 *
 * Centralizes the repeated pattern of alert + clearAlert used across
 * workout hooks (useEditDay, useAddDayDialog, useDayMenu).
 *
 * USAGE:
 * const { alert, setAlert, clearAlert } = useAlertState();
 */

import { useCallback, useState } from 'react';

export interface AlertState {
  title: string;
  description?: string;
}

export function useAlertState() {
  const [alert, setAlert] = useState<AlertState | null>(null);
  const clearAlert = useCallback(() => setAlert(null), []);
  return { alert, setAlert, clearAlert } as const;
}
