/**
 * Tabs - Tab navigation component
 *
 * Simple tap-based tabs with animated indicator.
 * Swipe gestures deferred to post-MVP due to PagerView compatibility issues
 * with complex nested views (FlashList) on Android.
 *
 * @see BACKLOG.md § Swipeable tabs for enhancement plans
 *
 * @example
 * ```tsx
 * <Tabs
 *   tabs={['Overview', 'Day Details']}
 *   activeIndex={activeTabIndex}
 *   onChange={setActiveTabIndex}
 *   renderScene={({ route }) => {
 *     if (route.key === 'tab-0') return <OverviewContent />;
 *     if (route.key === 'tab-1') return <DayDetailsContent />;
 *     return null;
 *   }}
 * />
 * ```
 */

import { Colors } from '@/constants';
import { memo, useMemo, useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Text } from './text';

export interface Route {
  key: string;
  title?: string;
}

// Re-export for consumers
export type TabRoute = Route;

interface SceneProps {
  route: Route;
}

export interface TabsProps {
  /** Tab labels */
  tabs: string[];
  /** Currently active tab index */
  activeIndex: number;
  /** Callback when tab changes */
  onChange: (index: number) => void;
  /** Render function for tab content */
  renderScene: (props: SceneProps) => ReactNode;
}

export const Tabs = memo(function Tabs({ tabs, activeIndex, onChange, renderScene }: TabsProps) {
  const { width } = useWindowDimensions();
  const tabWidth = width / tabs.length;
  const indicatorX = useSharedValue(activeIndex * tabWidth);

  // Convert tabs to routes for renderScene compatibility
  const routes = useMemo<Route[]>(
    () => tabs.map((title, index) => ({ key: `tab-${index}`, title })),
    [tabs]
  );

  // Animate indicator when activeIndex changes
  useEffect(() => {
    indicatorX.value = withTiming(activeIndex * tabWidth, { duration: 200 });
  }, [activeIndex, tabWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  // Get current route for rendering
  const currentRoute = routes[activeIndex];

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => (
          <Pressable
            key={index}
            style={styles.tab}
            onPress={() => onChange(index)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeIndex === index }}
          >
            <Text style={[styles.tabLabel, activeIndex === index && styles.tabLabelActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
        <Animated.View style={[styles.indicator, { width: tabWidth }, indicatorStyle]} />
      </View>

      {/* Content */}
      <View style={styles.content}>{currentRoute && renderScene({ route: currentRoute })}</View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.elevated,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.foreground.secondary,
  },
  tabLabelActive: {
    color: Colors.primary.DEFAULT,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: Colors.primary.DEFAULT,
  },
  content: {
    flex: 1,
  },
});
