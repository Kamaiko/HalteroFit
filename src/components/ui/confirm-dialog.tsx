/**
 * ConfirmDialog Component
 *
 * Modal confirmation dialog for destructive actions.
 * Used for: Delete routines, Discard workout, etc.
 *
 * Built on the Dialog shell component for consistent modal behavior.
 */

import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Dialog } from './dialog';
import { Text } from './text';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
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
    <Dialog open={open} onClose={handleCancel}>
      <Text className="text-center text-base font-semibold text-foreground">{title}</Text>

      <View className="mt-8 flex-row justify-end gap-6">
        <Pressable onPress={handleCancel} disabled={loading}>
          <Text className="text-base font-medium text-foreground-secondary">{cancelLabel}</Text>
        </Pressable>
        <Pressable onPress={handleConfirm} disabled={loading}>
          <Text className="text-base font-medium text-destructive">{confirmLabel}</Text>
        </Pressable>
      </View>
    </Dialog>
  );
}
