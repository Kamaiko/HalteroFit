/**
 * Home Screen - Dashboard
 *
 * Shows user progress summary and quick actions.
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/components/layout';

// Skeleton chart heights (deterministic for consistent skeleton)
const SKELETON_HEIGHTS = [45, 72, 58, 83, 51, 69, 62];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function HomeScreen() {
  return (
    <ScreenContainer scroll>
      {/* Header Welcome */}
      <View className="px-6 pt-6 pb-8">
        <Text className="text-base text-foreground-secondary font-normal mb-1">Welcome back,</Text>
        <Text className="text-3xl font-bold text-foreground">Athlete</Text>
      </View>

      {/* Stats Cards */}
      <View className="px-6 mb-8">
        <Text className="text-xl font-bold text-foreground mb-4">Your Progress</Text>
        <View className="flex-row gap-3">
          <StatCard icon="⚡" value={0} label="Workouts" />
          <StatCard icon="🔥" value={0} label="Total Sets" />
          <StatCard icon="📈" value={0} label="Volume (kg)" />
        </View>
      </View>

      {/* Weekly Progress Chart */}
      <View className="px-6 mb-8">
        <Text className="text-xl font-bold text-foreground mb-4">Weekly Progress</Text>
        <View className="bg-background-surface rounded-2xl p-5 border border-background-elevated min-h-[240px]">
          <SkeletonChart />
          <EmptyStateOverlay
            title="No workout data yet"
            subtitle="Start your first workout to see progress"
          />
        </View>
      </View>

      {/* CTA Start Workout */}
      <View className="px-6 mt-4 mb-8">
        <TouchableOpacity activeOpacity={0.9}>
          <LinearGradient
            colors={['#8A2BE2', '#00FFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-5 flex-row items-center justify-center shadow-lg"
          >
            <Text className="text-lg font-bold text-white tracking-widest">START WORKOUT</Text>
            <View className="w-2 h-2 rounded-full bg-cyan-400 ml-3" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View className="h-10" />
    </ScreenContainer>
  );
}

// ============================================================================
// Sub-components (kept in same file as they're Home-screen specific)
// ============================================================================

interface StatCardProps {
  icon: string;
  value: number;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View className="flex-1 bg-background-surface rounded-2xl p-4 items-center border border-background-elevated shadow-sm">
      <View className="w-10 h-10 rounded-full bg-background-elevated items-center justify-center mb-2">
        <Text className="text-xl">{icon}</Text>
      </View>
      <Text className="text-2xl font-bold text-primary mb-1">{value}</Text>
      <Text className="text-xs text-foreground-secondary uppercase tracking-wide">{label}</Text>
    </View>
  );
}

function SkeletonChart() {
  return (
    <View className="flex-row h-45 opacity-30">
      <View className="w-10 justify-between pr-2">
        {[100, 75, 50, 25, 0].map((val) => (
          <Text key={val} className="text-xs text-foreground-tertiary">
            {val}
          </Text>
        ))}
      </View>
      <View className="flex-1 flex-row justify-around items-end">
        {WEEKDAYS.map((day, i) => (
          <View key={day} className="items-center flex-1">
            <View
              className="w-5 bg-background-elevated rounded mb-2"
              style={{ height: SKELETON_HEIGHTS[i] }}
            />
            <Text className="text-xs text-foreground-tertiary mt-1">{day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface EmptyStateOverlayProps {
  title: string;
  subtitle: string;
}

function EmptyStateOverlay({ title, subtitle }: EmptyStateOverlayProps) {
  return (
    <View className="absolute inset-0 items-center justify-center">
      <Text className="text-base font-semibold text-foreground mb-2">{title}</Text>
      <Text className="text-sm text-foreground-tertiary text-center">{subtitle}</Text>
    </View>
  );
}
