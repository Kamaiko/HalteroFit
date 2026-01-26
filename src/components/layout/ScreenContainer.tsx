/**
 * ScreenContainer
 *
 * Provides consistent screen layout with:
 * - Gray status bar band (bg-background-surface)
 * - Dark content area (bg-background)
 * - Proper SafeAreaView handling for iOS notch/Dynamic Island
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
 */

import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: ReactNode;
  /** Enable ScrollView wrapper for scrollable content */
  scroll?: boolean;
  /** Additional className for the content View */
  contentClassName?: string;
}

export function ScreenContainer({
  children,
  scroll = false,
  contentClassName = '',
}: ScreenContainerProps) {
  const content = scroll ? (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <SafeAreaView className="flex-1 bg-background-surface" edges={['top']}>
      <View className={`flex-1 bg-background ${contentClassName}`.trim()}>{content}</View>
    </SafeAreaView>
  );
}
