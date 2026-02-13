/**
 * UI Components - Project-Customized Components
 *
 * This barrel exports components built or heavily customized for this project.
 * ShadCN/react-native-reusables primitives (button, text, card, input, label,
 * progress, skeleton, alert, alert-dialog, icon) are imported directly from
 * their files — e.g. `from '@/components/ui/button'`.
 *
 * Usage:
 *   import { CachedImage, Tabs, BottomSheet } from '@/components/ui';
 *   import { Button } from '@/components/ui/button';  // ShadCN primitive
 */

export { CachedImage, CachedImageStyles } from './cached-image';
export type { CachedImageProps } from './cached-image';

export { Tabs } from './tabs';
export type { TabsProps, Route as TabRoute } from './tabs';

export { BottomSheet } from './bottom-sheet';
export type { BottomSheetProps, BottomSheetRef } from './bottom-sheet';

export { ConfirmDialog } from './confirm-dialog';
export type { ConfirmDialogProps } from './confirm-dialog';

export { Dialog } from './dialog';
export type { DialogProps } from './dialog';

export { InputDialog } from './input-dialog';
export type { InputDialogProps } from './input-dialog';
