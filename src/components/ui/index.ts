/**
 * UI Components - Generic Reusable Components
 *
 * Purpose: Generic, reusable UI primitives used across features
 * Convention: Library-agnostic interfaces with sophisticated internals
 *
 * Usage:
 *   import { CachedImage, SwipeableTabs, BottomSheet } from '@/components/ui';
 *
 * @see components/ui/README.md - Complete usage guide
 * @see docs/ARCHITECTURE.md - Component organization principles
 */

export { CachedImage, CachedImageStyles } from './CachedImage';
export type { CachedImageProps } from './CachedImage';

export { SwipeableTabs } from './swipeable-tabs';
export type { SwipeableTabsProps, Route as SwipeableTabRoute } from './swipeable-tabs';

export { BottomSheet } from './bottom-sheet';
export type { BottomSheetProps, BottomSheetRef } from './bottom-sheet';

export { ConfirmDialog } from './confirm-dialog';
export type { ConfirmDialogProps } from './confirm-dialog';
