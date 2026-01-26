/**
 * Home Screen - Dashboard
 *
 * Migrated to NativeWind for cleaner, more maintainable styling
 */

import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

// Skeleton chart heights (randomish but deterministic for skeleton)
const SKELETON_HEIGHTS = [45, 72, 58, 83, 51, 69, 62];

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background-surface" edges={['top']}>
      <View className="flex-1 bg-background">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header Welcome */}
          <View className="px-6 pt-6 pb-8">
            <Text className="text-base text-foreground-secondary font-normal mb-1">
              Welcome back,
            </Text>
            <Text className="text-3xl font-bold text-foreground">Athlete</Text>
          </View>

          {/* Stats Cards */}
          <View className="px-6 mb-8">
            <Text className="text-xl font-bold text-foreground mb-4">Your Progress</Text>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-background-surface rounded-2xl p-4 items-center border border-background-elevated shadow-sm">
                <View className="w-10 h-10 rounded-full bg-background-elevated items-center justify-center mb-2">
                  <Text className="text-xl">⚡</Text>
                </View>
                <Text className="text-2xl font-bold text-primary mb-1">0</Text>
                <Text className="text-xs text-foreground-secondary uppercase tracking-wide">
                  Workouts
                </Text>
              </View>

              <View className="flex-1 bg-background-surface rounded-2xl p-4 items-center border border-background-elevated shadow-sm">
                <View className="w-10 h-10 rounded-full bg-background-elevated items-center justify-center mb-2">
                  <Text className="text-xl">🔥</Text>
                </View>
                <Text className="text-2xl font-bold text-primary mb-1">0</Text>
                <Text className="text-xs text-foreground-secondary uppercase tracking-wide">
                  Total Sets
                </Text>
              </View>

              <View className="flex-1 bg-background-surface rounded-2xl p-4 items-center border border-background-elevated shadow-sm">
                <View className="w-10 h-10 rounded-full bg-background-elevated items-center justify-center mb-2">
                  <Text className="text-xl">📈</Text>
                </View>
                <Text className="text-2xl font-bold text-primary mb-1">0</Text>
                <Text className="text-xs text-foreground-secondary uppercase tracking-wide">
                  Volume (kg)
                </Text>
              </View>
            </View>
          </View>

          {/* Chart Section with Skeleton */}
          <View className="px-6 mb-8">
            <Text className="text-xl font-bold text-foreground mb-4">Weekly Progress</Text>
            <View className="bg-background-surface rounded-2xl p-5 border border-background-elevated min-h-[240px]">
              {/* Skeleton Chart */}
              <View className="flex-row h-45 opacity-30">
                <View className="w-10 justify-between pr-2">
                  {[100, 75, 50, 25, 0].map((val, i) => (
                    <Text key={i} className="text-xs text-foreground-tertiary">
                      {val}
                    </Text>
                  ))}
                </View>
                <View className="flex-1 flex-row justify-around items-end">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                    <View key={i} className="items-center flex-1">
                      <View
                        className="w-5 bg-background-elevated rounded mb-2"
                        style={{ height: SKELETON_HEIGHTS[i] }}
                      />
                      <Text className="text-xs text-foreground-tertiary mt-1">{day}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Empty State Overlay */}
              <View className="absolute inset-0 items-center justify-center">
                <Text className="text-base font-semibold text-foreground mb-2">
                  No workout data yet
                </Text>
                <Text className="text-sm text-foreground-tertiary text-center">
                  Start your first workout to see progress
                </Text>
              </View>
            </View>
          </View>

          {/* CTA Start Workout */}
          <View className="px-6 mt-4 mb-8">
            <TouchableOpacity activeOpacity={0.9}>
              <LinearGradient
                colors={['#8A2BE2', '#00FFFF']} // Vibrant gradient for CTA (intentional design choice)
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
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
