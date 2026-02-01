/**
 * AlertDialog - Single-button informational dialog
 *
 * Used for: validation messages, warnings, error feedback.
 * Built on the Dialog shell component for consistent modal behavior.
 *
 * For destructive confirmations (two buttons), use ConfirmDialog instead.
 */

import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Dialog } from './dialog';
import { Text } from './text';

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  buttonLabel?: string;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  buttonLabel = 'Got it',
}: AlertDialogProps) {
  const handleDismiss = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onClose={handleDismiss}>
      <Text className="text-base font-semibold text-foreground">{title}</Text>

      {description ? (
        <Text className="mt-2 text-sm text-foreground-secondary">{description}</Text>
      ) : null}

      <View className="mt-6 flex-row justify-end">
        <Pressable onPress={handleDismiss}>
          <Text className="text-base font-medium text-foreground-secondary">{buttonLabel}</Text>
        </Pressable>
      </View>
    </Dialog>
  );
}
