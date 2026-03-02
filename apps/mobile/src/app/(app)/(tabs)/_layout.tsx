import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Colors,
  ICON_SIZE_MD,
  TAB_BAR_HEIGHT,
  TAB_BAR_PADDING_BOTTOM,
  TAB_BAR_PADDING_TOP,
} from '@/constants';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.surface, paddingTop: insets.top }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.primary.DEFAULT,
          tabBarInactiveTintColor: Colors.foreground.tertiary,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
          sceneStyle: { backgroundColor: Colors.background.DEFAULT },
        }}
        detachInactiveScreens={false}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Ionicons name="home" size={ICON_SIZE_MD} color={color} />,
          }}
        />
        <Tabs.Screen
          name="workout"
          options={{
            title: 'Workout',
            lazy: false, // Primary feature tab — mount during splash to eliminate loading flash on first navigation
            tabBarIcon: ({ color }) => (
              <Ionicons name="checkmark-circle" size={ICON_SIZE_MD} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="exercises"
          options={{
            title: 'Exercises',
            lazy: false,
            tabBarIcon: ({ color }) => (
              <Ionicons name="barbell" size={ICON_SIZE_MD} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            lazy: false,
            tabBarIcon: ({ color }) => (
              <Ionicons name="stats-chart" size={ICON_SIZE_MD} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.background.elevated,
    height: TAB_BAR_HEIGHT,
    paddingBottom: TAB_BAR_PADDING_BOTTOM,
    paddingTop: TAB_BAR_PADDING_TOP,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
