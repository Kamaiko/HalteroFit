/**
 * Dialog - Base modal dialog shell
 *
 * Provides the common structure shared by all modal dialogs:
 * Portal + Modal + backdrop + centered opaque card container.
 *
 * Use this as a building block for specific dialog types
 * (ConfirmDialog, InputDialog, etc.) rather than directly in screens.
 */

import React, { useId } from 'react';
import { Modal, type ModalProps, Pressable, View } from 'react-native';
import { Portal } from '@rn-primitives/portal';

export interface DialogProps {
  /** Whether the dialog is visible */
  open: boolean;
  /** Called when the user dismisses the dialog (backdrop tap or back button) */
  onClose: () => void;
  /** Dialog content (title, form fields, buttons, etc.) */
  children: React.ReactNode;
  /** Portal name override (auto-generated with useId if not provided) */
  portalName?: string;
  /** Called when the modal finishes showing (useful for auto-focus) */
  onShow?: ModalProps['onShow'];
}

export function Dialog({ open, onClose, children, portalName, onShow }: DialogProps) {
  const autoId = useId();
  const name = portalName ?? `dialog-${autoId}`;

  return (
    <Portal name={name}>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
        onShow={onShow}
      >
        <Pressable className="flex-1 items-center justify-center bg-black/60" onPress={onClose}>
          <View
            className="mx-10 w-full max-w-xs rounded-xl bg-background-surface p-6"
            onStartShouldSetResponder={() => true}
          >
            {children}
          </View>
        </Pressable>
      </Modal>
    </Portal>
  );
}
