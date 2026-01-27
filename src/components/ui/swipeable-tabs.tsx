/**
 * SwipeableTabs - Swipeable tab navigation component
 *
 * Uses reanimated-tab-view for smooth swipe gestures.
 * This replaces the old PagerView-based implementation that crashed on Android.
 *
 * @see BACKLOG.md § Swipeable tabs for history
 *
 * @example
 * ```tsx
 * <SwipeableTabs
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
import { memo, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  TabBar,
  TabView,
  type NavigationState,
  type TabBarProps,
  type SceneRendererProps,
} from 'reanimated-tab-view';

export interface Route {
  key: string;
  title?: string;
}

export interface SwipeableTabsProps {
  /** Tab labels */
  tabs: string[];
  /** Currently active tab index */
  activeIndex: number;
  /** Callback when tab changes */
  onChange: (index: number) => void;
  /** Render function for tab content */
  renderScene: (props: SceneRendererProps) => ReactNode;
}

export const SwipeableTabs = memo(function SwipeableTabs({
  tabs,
  activeIndex,
  onChange,
  renderScene,
}: SwipeableTabsProps) {
  const layout = useWindowDimensions();

  // Convert tabs array to routes format
  const routes = useMemo(
    () => tabs.map((title, index) => ({ key: `tab-${index}`, title })),
    [tabs]
  );

  // Navigation state for TabView
  const navigationState = useMemo<NavigationState>(
    () => ({
      index: activeIndex,
      routes,
    }),
    [activeIndex, routes]
  );

  // Custom tab bar with our theme
  const renderTabBar = useCallback(
    (props: TabBarProps) => (
      <TabBar
        {...props}
        style={styles.tabBar}
        indicatorStyle={styles.indicator}
        activeColor={Colors.primary.DEFAULT}
        inactiveColor={Colors.foreground.tertiary}
        labelStyle={styles.label}
      />
    ),
    []
  );

  return (
    <TabView
      style={styles.container}
      navigationState={navigationState}
      renderScene={renderScene}
      onIndexChange={onChange}
      initialLayout={{ tabView: { width: layout.width } }}
      tabBarConfig={{
        renderTabBar,
        tabBarPosition: 'top',
      }}
      swipeEnabled={true}
      renderMode="all"
    />
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: Colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.elevated,
    elevation: 0,
    shadowOpacity: 0,
  },
  indicator: {
    backgroundColor: Colors.primary.DEFAULT,
    height: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'none',
  },
});
