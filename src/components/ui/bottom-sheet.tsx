/**
 * BottomSheet Component
 *
 * Wrapper around @gorhom/bottom-sheet for modal-style content.
 * Used for: Filters, Rest Timer config, Context menus.
 *
 * @see docs/reference/jefit/JEFIT_UI_SPEC.md - Section 7.2 (BottomSheet)
 */

import { cn } from '@/lib/utils';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import { View } from 'react-native';

import { Text } from './text';

// Ref type for imperative control
export interface BottomSheetRef {
  open: () => void;
  close: () => void;
  snapToIndex: (index: number) => void;
}

// Props (React 19: ref is a regular prop, no forwardRef needed)
export interface BottomSheetProps {
  ref?: React.Ref<BottomSheetRef>;
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  title?: string;
  onClose?: () => void;
  enablePanDownToClose?: boolean;
  className?: string;
}

/**
 * BottomSheet - Modal-style bottom sheet
 *
 * @example
 * ```tsx
 * const sheetRef = useRef<BottomSheetRef>(null);
 *
 * <Button onPress={() => sheetRef.current?.open()}>Open</Button>
 *
 * <BottomSheet ref={sheetRef} title="Filters" snapPoints={['50%']}>
 *   <FilterContent />
 * </BottomSheet>
 * ```
 */
export function BottomSheet({
  ref,
  children,
  snapPoints = ['50%'],
  title,
  onClose,
  enablePanDownToClose = true,
  className,
}: BottomSheetProps) {
  const bottomSheetRef = React.useRef<GorhomBottomSheet>(null);

  // Expose imperative methods
  React.useImperativeHandle(ref, () => ({
    open: () => bottomSheetRef.current?.snapToIndex(0),
    close: () => bottomSheetRef.current?.close(),
    snapToIndex: (index: number) => bottomSheetRef.current?.snapToIndex(index),
  }));

  // Backdrop component
  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  // Handle sheet changes
  const handleSheetChanges = React.useCallback(
    (index: number) => {
      if (index === -1) {
        onClose?.();
      }
    },
    [onClose]
  );

  return (
    <GorhomBottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={enablePanDownToClose}
      backdropComponent={renderBackdrop}
      onChange={handleSheetChanges}
      backgroundStyle={{
        backgroundColor: '#1A1A1A', // background-surface
      }}
      handleIndicatorStyle={{
        backgroundColor: '#666666', // foreground-tertiary
      }}
    >
      <BottomSheetView className={cn('flex-1 px-4', className)}>
        {/* Header with title */}
        {title && (
          <View className="mb-4 border-b border-background-elevated pb-3">
            <Text className="text-center text-lg font-semibold text-foreground">{title}</Text>
          </View>
        )}

        {/* Content */}
        {children}
      </BottomSheetView>
    </GorhomBottomSheet>
  );
}
