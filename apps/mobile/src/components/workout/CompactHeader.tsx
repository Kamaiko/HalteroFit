/**
 * CompactHeader - Compact plan header for the workout timeline
 *
 * Displays plan name, day/exercise counts, and "All Plans" navigation pill.
 * Matches the mockup: background #1A1A1A, border-bottom #2D3748.
 */

import { router } from 'expo-router';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Colors, ICON_SIZE_XS } from '@/constants';

interface CompactHeaderProps {
  planName: string;
  dayCount: number;
  exerciseCount: number;
}

export const CompactHeader = memo(function CompactHeader({
  planName,
  dayCount,
  exerciseCount,
}: CompactHeaderProps) {
  const handleAllPlansPress = useCallback(() => {
    router.push('/plans');
  }, []);

  const subtitle = `${dayCount} day${dayCount !== 1 ? 's' : ''} · ${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`;

  return (
    <View style={styles.container}>
      <View className="flex-row items-start justify-between">
        {/* Plan name + chevron (visual only — TODO: plan switcher bottom sheet) */}
        <View className="flex-row items-center flex-1 mr-4">
          <Text className="text-xl font-bold text-foreground" numberOfLines={1}>
            {planName}
          </Text>
          <Ionicons
            name="chevron-down"
            size={ICON_SIZE_XS}
            color={Colors.foreground.tertiary}
            style={{ marginLeft: 6 }}
          />
        </View>

        {/* All Plans navigation pill */}
        <Pressable
          onPress={handleAllPlansPress}
          style={styles.allPlansPill}
          className="active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="All Plans"
        >
          <Text style={styles.allPlansText}>All Plans</Text>
        </Pressable>
      </View>

      {/* Subtitle: day + exercise count */}
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.surface,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  allPlansPill: {
    backgroundColor: 'rgba(14,165,233,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  allPlansText: {
    color: Colors.primary.DEFAULT,
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    color: Colors.foreground.tertiary,
    fontSize: 13,
    marginTop: 2,
  },
});
