/**
 * BottomSheet Component
 *
 * Wrapper around @gorhom/bottom-sheet for modal-style content.
 * Uses glassmorphism (semi-transparent overlay + subtle borders) for a modern look.
 *
 * NOTE: Uses React.forwardRef instead of React 19 ref-as-prop because
 * @gorhom/bottom-sheet internally inspects the component type.
 *
 * @see docs/reference/jefit/JEFIT_UI_SPEC.md - Section 7.2 (BottomSheet)
 */

import { cn } from '@/lib/utils';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './text';

// Props
export interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  title?: string;
  onClose?: () => void;
  enablePanDownToClose?: boolean;
  className?: string;
}

// Ref type for imperative control
export interface BottomSheetRef {
  open: () => void;
  close: () => void;
  snapToIndex: (index: number) => void;
}

/** Glassmorphism background for the bottom sheet */
function GlassBackground({ style }: BottomSheetBackgroundProps) {
  return (
    <View style={[style, styles.backgroundContainer]}>
      <View style={[StyleSheet.absoluteFill, styles.backgroundOverlay]} />
    </View>
  );
}

/**
 * BottomSheet - Modal-style bottom sheet with glassmorphism
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
export const BottomSheet = React.forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    { children, snapPoints = ['50%'], title, onClose, enablePanDownToClose = true, className },
    ref
  ) => {
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
        backgroundComponent={GlassBackground}
        onChange={handleSheetChanges}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView className={cn('flex-1 px-4', className)}>
          {/* Header with title */}
          {title && (
            <View className="mb-4 border-b border-white/10 pb-3">
              <Text className="text-center text-lg font-semibold text-foreground">{title}</Text>
            </View>
          )}

          {/* Content */}
          {children}
        </BottomSheetView>
      </GorhomBottomSheet>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';

const styles = StyleSheet.create({
  backgroundContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  backgroundOverlay: {
    backgroundColor: 'rgba(26, 26, 26, 0.7)',
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
