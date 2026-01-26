/**
 * SimpleTabs - Basic tab navigation component
 *
 * A lightweight alternative to SwipeableTabs for cases where
 * swipe gestures are not needed or PagerView causes issues.
 *
 * TODO: Add swipe gesture support (see BACKLOG.md § UX Enhancements)
 * - Investigate PagerView crash (IllegalViewOperationException)
 * - Consider react-native-tab-view or custom gesture handler
 *
 * @example
 * ```tsx
 * <SimpleTabs
 *   tabs={['Overview', 'Day Details']}
 *   activeIndex={activeTabIndex}
 *   onChange={setActiveTabIndex}
 * />
 * ```
 */

import { Pressable, View } from 'react-native';

import { cn } from '@/lib/utils';

import { Text } from './text';

export interface SimpleTabsProps {
  /** Tab labels */
  tabs: string[];
  /** Currently active tab index */
  activeIndex: number;
  /** Callback when tab is pressed */
  onChange: (index: number) => void;
  /** Additional className for container */
  className?: string;
}

export function SimpleTabs({ tabs, activeIndex, onChange, className }: SimpleTabsProps) {
  return (
    <View
      className={cn(
        'flex-row border-b border-background-elevated bg-background-surface',
        className
      )}
    >
      {tabs.map((label, index) => (
        <Pressable
          key={label}
          className={cn(
            'flex-1 items-center justify-center py-3',
            index === activeIndex && 'border-b-2 border-primary'
          )}
          onPress={() => onChange(index)}
          accessibilityRole="tab"
          accessibilityState={{ selected: index === activeIndex }}
        >
          <Text
            className={cn(
              'text-sm font-medium',
              index === activeIndex ? 'text-primary' : 'text-foreground-tertiary'
            )}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
