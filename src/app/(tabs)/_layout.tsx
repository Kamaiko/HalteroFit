import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Colors } from '@/constants';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary.DEFAULT,
        tabBarInactiveTintColor: Colors.foreground.tertiary,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>✓</Text>,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏋️</Text>,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.background.elevated,
    height: 85,
    paddingBottom: 25,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
