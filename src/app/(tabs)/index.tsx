/**
 * Home Screen - Dashboard
 *
 * Shows user progress summary and quick actions.
 */

import type { ComponentProps } from 'react';
import { Image, Pressable, View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/layout';
import { Ionicons, MaterialIcons } from '@/components/ui/icon';
import {
  BORDER_RADIUS_MD,
  Colors,
  DURATION_FAST,
  DURATION_MODERATE,
  ICON_SIZE_LG,
  ICON_SIZE_MD,
} from '@/constants';
import appIcon from '../../../assets/icon.png';

export default function HomeScreen() {
  return (
    <ScreenContainer scroll>
      {/* Header — branding centered */}
      <View className="items-center px-6 pt-2">
        <View className="flex-row items-center gap-2">
          <Image
            source={appIcon}
            style={{ width: ICON_SIZE_LG, height: ICON_SIZE_LG, borderRadius: BORDER_RADIUS_MD }}
          />
          <Text className="text-sm font-semibold text-foreground">Halterofit</Text>
        </View>
      </View>

      {/* Profile button — right-aligned, between header and content */}
      <View className="flex-row justify-end px-6 mt-1">
        <Pressable
          onPress={() => router.push('/settings')}
          className="w-10 h-10 rounded-full items-center justify-center bg-background-elevated"
        >
          <Ionicons name="person" size={ICON_SIZE_MD} color={Colors.foreground.secondary} />
        </Pressable>
      </View>

      {/* Summary Section */}
      <Animated.View entering={FadeInUp.duration(DURATION_MODERATE)} className="px-6 mt-2 mb-8">
        <Text className="text-xl font-bold text-foreground mb-4">Summary</Text>
        <View className="flex-row gap-3">
          <StatCard icon="bolt" value={0} label="Workouts" />
          <StatCard icon="layers" value={0} label="Total Sets" />
          <StatCard icon="trending-up" value={0} label="Volume (kg)" />
        </View>
      </Animated.View>

      {/* Weekly Progress Chart */}
      <Animated.View
        entering={FadeInUp.duration(DURATION_MODERATE).delay(DURATION_FAST)}
        className="px-6 mb-8"
      >
        <Text className="text-xl font-bold text-foreground mb-4">Weekly Progress</Text>
        <View className="bg-background-surface rounded-2xl p-5 border border-background-elevated min-h-[240px] items-center justify-center">
          <ChartEmptyState />
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}

// ============================================================================
// Sub-components (kept in same file as they're Home-screen specific)
// ============================================================================

interface StatCardProps {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  value: number;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View className="flex-1 bg-background-surface rounded-2xl p-4 items-center border border-background-elevated shadow-sm">
      <View className="w-16 h-16 rounded-full items-center justify-center mb-3 bg-background border border-background-elevated">
        <MaterialIcons name={icon} size={ICON_SIZE_LG} color={Colors.primary.DEFAULT} />
      </View>
      <Text
        className={`text-2xl font-bold mb-1 ${value > 0 ? 'text-foreground' : 'text-foreground-secondary'}`}
      >
        {value}
      </Text>
      <Text className="text-xs text-foreground-secondary uppercase tracking-wide">{label}</Text>
    </View>
  );
}

function ChartEmptyState() {
  return (
    <View className="items-center justify-center py-4">
      <Svg width={120} height={100} viewBox="0 0 120 100">
        <Defs>
          <SvgGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.primary.light} stopOpacity={0.6} />
            <Stop offset="1" stopColor={Colors.primary.DEFAULT} stopOpacity={0.15} />
          </SvgGradient>
        </Defs>
        <Rect x={18} y={65} width={24} height={35} rx={4} fill="url(#barGrad)" opacity={0.5} />
        <Rect x={48} y={45} width={24} height={55} rx={4} fill="url(#barGrad)" opacity={0.7} />
        <Rect x={78} y={20} width={24} height={80} rx={4} fill="url(#barGrad)" opacity={0.9} />
      </Svg>
      <Text className="text-sm font-semibold text-foreground-secondary mt-4">No data yet</Text>
      <Text className="text-xs text-foreground-tertiary mt-1 text-center">
        Complete a workout to see weekly trends
      </Text>
    </View>
  );
}
