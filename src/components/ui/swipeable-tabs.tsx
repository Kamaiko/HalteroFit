/**
 * SwipeableTabs Component
 *
 * Horizontal swipeable tab navigation using react-native-pager-view.
 * Used for: Overview/Day Details, History/Chart/Guide patterns.
 *
 * @see docs/reference/jefit/JEFIT_UI_SPEC.md - Section 3.2 (SwipeableTabs)
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';

import { Text } from './text';

// Tab configuration
export interface TabConfig {
  key: string;
  label: string;
}

// Props
export interface SwipeableTabsProps {
  tabs: TabConfig[];
  children: React.ReactNode[];
  initialPage?: number;
  onPageChange?: (index: number) => void;
  className?: string;
  tabBarClassName?: string;
}

/**
 * SwipeableTabs - Horizontal swipeable tab navigation
 *
 * @example
 * ```tsx
 * <SwipeableTabs
 *   tabs={[{ key: 'overview', label: 'Overview' }, { key: 'details', label: 'Day Details' }]}
 *   onPageChange={(index) => console.log('Page:', index)}
 * >
 *   <OverviewContent />
 *   <DayDetailsContent />
 * </SwipeableTabs>
 * ```
 */
export function SwipeableTabs({
  tabs,
  children,
  initialPage = 0,
  onPageChange,
  className,
  tabBarClassName,
}: SwipeableTabsProps) {
  const pagerRef = React.useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = React.useState(initialPage);

  // Handle page selection from swipe
  const handlePageSelected = React.useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const { position } = event.nativeEvent;
      setActiveIndex(position);
      onPageChange?.(position);
    },
    [onPageChange]
  );

  // Handle tab press
  const handleTabPress = React.useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  }, []);

  return (
    <View className={cn('flex-1', className)}>
      {/* Tab Bar */}
      <View
        className={cn(
          'flex-row border-b border-background-elevated bg-background-surface',
          tabBarClassName
        )}
      >
        {tabs.map((tab, index) => (
          <TabButton
            key={tab.key}
            label={tab.label}
            isActive={index === activeIndex}
            onPress={() => handleTabPress(index)}
          />
        ))}
      </View>

      {/* Swipeable Content */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={initialPage}
        onPageSelected={handlePageSelected}
        overdrag
      >
        {React.Children.map(children, (child, index) => (
          <View key={tabs[index]?.key ?? index} style={{ flex: 1 }}>
            {child}
          </View>
        ))}
      </PagerView>
    </View>
  );
}

// Tab Button Component
interface TabButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function TabButton({ label, isActive, onPress }: TabButtonProps) {
  return (
    <Pressable
      className={cn(
        'flex-1 items-center justify-center py-3',
        isActive && 'border-b-2 border-primary'
      )}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Text
        className={cn(
          'text-sm font-medium',
          isActive ? 'text-primary' : 'text-foreground-tertiary'
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
