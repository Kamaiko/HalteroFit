/**
 * ConfirmDialog Component
 *
 * Modal confirmation dialog for destructive actions.
 * Used for: Delete routines, Discard workout, etc.
 *
 * @see docs/reference/jefit/JEFIT_UI_SPEC.md - Section 7.3 (ConfirmDialog)
 */

import { cn } from '@/lib/utils';
import { Portal } from '@rn-primitives/portal';
import * as React from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Button } from './button';
import { Text } from './text';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

/**
 * ConfirmDialog - Modal confirmation dialog
 *
 * @example
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false);
 *
 * <ConfirmDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   title="Delete Workout Plan"
 *   description="This action cannot be undone."
 *   confirmLabel="Delete"
 *   variant="destructive"
 *   onConfirm={() => handleDelete()}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const handleCancel = React.useCallback(() => {
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  const handleConfirm = React.useCallback(() => {
    onConfirm();
    onOpenChange(false);
  }, [onConfirm, onOpenChange]);

  return (
    <Portal name="confirm-dialog">
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <Pressable
          className="flex-1 items-center justify-center bg-black/60"
          onPress={handleCancel}
        >
          {/* Dialog */}
          <Pressable
            className={cn('mx-6 w-full max-w-sm rounded-xl bg-background-surface p-6', 'shadow-lg')}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <Text className="text-center text-lg font-semibold text-foreground">{title}</Text>

            {/* Description */}
            {description && (
              <Text className="mt-2 text-center text-sm text-foreground-secondary">
                {description}
              </Text>
            )}

            {/* Actions */}
            <View className="mt-6 flex-row gap-3">
              {/* Cancel Button */}
              <Button
                variant="outline"
                className="flex-1"
                onPress={handleCancel}
                disabled={loading}
              >
                <Text>{cancelLabel}</Text>
              </Button>

              {/* Confirm Button */}
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                className="flex-1"
                onPress={handleConfirm}
                disabled={loading}
              >
                <Text>{confirmLabel}</Text>
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Portal>
  );
}
