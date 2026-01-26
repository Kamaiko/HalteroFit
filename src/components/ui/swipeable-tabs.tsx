/**
 * SwipeableTabs - Horizontal swipeable tab navigation
 *
 * KNOWN ISSUE: Crashes on Android with IllegalViewOperationException.
 * Use SimpleTabs until this is resolved. See BACKLOG.md for details.
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';

import { Text } from './text';

export interface TabConfig {
  key: string;
  label: string;
}

export interface SwipeableTabsProps {
  tabs: TabConfig[];
  children: React.ReactNode[];
  initialPage?: number;
  activeIndex?: number;
  onPageChange?: (index: number) => void;
  className?: string;
  tabBarClassName?: string;
}

export function SwipeableTabs({
  tabs,
  children,
  initialPage = 0,
  activeIndex: controlledIndex,
  onPageChange,
  className,
  tabBarClassName,
}: SwipeableTabsProps) {
  const pagerRef = React.useRef<PagerView>(null);
  const [internalIndex, setInternalIndex] = React.useState(initialPage);

  const isControlled = controlledIndex !== undefined;
  const activeIndex = isControlled ? controlledIndex : internalIndex;

  React.useEffect(() => {
    if (isControlled && pagerRef.current) {
      // eslint-disable-next-line no-undef
      requestAnimationFrame(() => {
        pagerRef.current?.setPageWithoutAnimation(controlledIndex);
      });
    }
  }, [isControlled, controlledIndex]);

  const handlePageSelected = React.useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const { position } = event.nativeEvent;
      if (!isControlled) {
        setInternalIndex(position);
      }
      onPageChange?.(position);
    },
    [onPageChange, isControlled]
  );

  const handleTabPress = React.useCallback(
    (index: number) => {
      pagerRef.current?.setPage(index);
      if (!isControlled) {
        setInternalIndex(index);
      }
      onPageChange?.(index);
    },
    [isControlled, onPageChange]
  );

  const childrenArray = React.Children.toArray(children);

  return (
    <View className={cn('flex-1', className)}>
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

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={initialPage}
        onPageSelected={handlePageSelected}
        offscreenPageLimit={1}
      >
        {childrenArray.map((child, index) => (
          <View key={tabs[index]?.key ?? `page-${index}`} style={{ flex: 1 }} collapsable={false}>
            {child}
          </View>
        ))}
      </PagerView>
    </View>
  );
}

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
