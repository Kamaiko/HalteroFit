/**
 * useObservable - Subscribe to an RxJS Observable and track its latest value as React state.
 *
 * Handles subscribe/unsubscribe lifecycle automatically.
 * Resets to initialValue when observable is undefined (dependency not ready).
 *
 * USAGE:
 * const obs = useMemo(() => id ? observeItems(id) : undefined, [id]);
 * const items = useObservable(obs, [], (err) => handleError(err, 'observeItems'));
 */

import { useEffect, useRef, useState } from 'react';
import type { Observable } from 'rxjs';

export function useObservable<T>(
  observable: Observable<T> | undefined,
  initialValue: T,
  onError?: (error: unknown) => void
): T {
  const [value, setValue] = useState<T>(initialValue);
  const initialValueRef = useRef(initialValue);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!observable) {
      setValue(initialValueRef.current);
      return;
    }

    const subscription = observable.subscribe({
      next: setValue,
      error: (err) => onErrorRef.current?.(err),
    });

    return () => subscription.unsubscribe();
  }, [observable]);

  return value;
}
