/**
 * ScreenContainer
 *
 * Provides consistent screen layout with:
 * - Gray status bar band (bg-background-surface)
 * - Dark content area (bg-background)
 * - Proper safe area handling for iOS notch/Dynamic Island
 *
 * Uses useSafeAreaInsets() directly to avoid layout shift
 * that can occur with SafeAreaView's delayed inset calculation.
 *
 * @example
 * <ScreenContainer>
 *   <View>Screen content here</View>
 * </ScreenContainer>
 *
 * @example With scroll
 * <ScreenContainer scroll>
 *   <View>Scrollable content</View>
 * </ScreenContainer>
 *
 * @example Without top safe area (fullscreen modals)
 * <ScreenContainer edges={[]}>
 *   <View>Fullscreen content</View>
 * </ScreenContainer>
 */

import { ReactNode, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: ReactNode;
  /** Enable ScrollView wrapper for scrollable content */
  scroll?: boolean;
  /** Additional className for the content View */
  contentClassName?: string;
  /** Safe area edges to apply (default: ['top']) */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenContainer({
  children,
  scroll = false,
  contentClassName = '',
  edges = ['top'],
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  // Memoize padding to avoid recalculation on every render
  const paddingStyle = useMemo(
    () => ({
      paddingTop: edges.includes('top') ? insets.top : 0,
      paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
      paddingLeft: edges.includes('left') ? insets.left : 0,
      paddingRight: edges.includes('right') ? insets.right : 0,
    }),
    [edges, insets.top, insets.bottom, insets.left, insets.right]
  );

  const content = scroll ? (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <View className="flex-1 bg-background-surface" style={paddingStyle}>
      <View className={`flex-1 bg-background ${contentClassName}`.trim()}>{content}</View>
    </View>
  );
}
