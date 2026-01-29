/**
 * InputDialog - Modal dialog with a text input
 *
 * Used for: Add workout day, Rename items, etc.
 * Built on the Dialog shell component for consistent modal behavior.
 */

import * as React from 'react';
import { type TextInput, View } from 'react-native';

import { Button } from './button';
import { Dialog } from './dialog';
import { Input } from './input';
import { Text } from './text';

export interface InputDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Input placeholder text */
  placeholder?: string;
  /** Controlled input value */
  value: string;
  onChangeText: (text: string) => void;
  /** Label for the confirm button */
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  /** Disables both buttons (e.g. while saving) */
  loading?: boolean;
}

export function InputDialog({
  open,
  onClose,
  title,
  placeholder,
  value,
  onChangeText,
  confirmLabel = 'Add',
  cancelLabel = 'Cancel',
  onConfirm,
  loading = false,
}: InputDialogProps) {
  const inputRef = React.useRef<TextInput>(null);

  const handleShow = React.useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Dialog open={open} onClose={onClose} portalName="input-dialog" onShow={handleShow}>
      <Text className="text-center text-xl font-semibold text-foreground">{title}</Text>

      <Input
        ref={inputRef}
        className="mt-5"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onConfirm}
        returnKeyType="done"
        autoCapitalize="words"
      />

      <View className="mt-6 flex-row gap-4">
        <Button variant="outline" className="flex-1" onPress={onClose} disabled={loading}>
          <Text>{cancelLabel}</Text>
        </Button>
        <Button className="flex-1" onPress={onConfirm} disabled={loading}>
          <Text>{confirmLabel}</Text>
        </Button>
      </View>
    </Dialog>
  );
}
