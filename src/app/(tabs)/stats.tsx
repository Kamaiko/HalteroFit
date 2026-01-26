import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StatsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background-surface" edges={['top']}>
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-3xl font-bold text-foreground mb-2">Statistics</Text>
        <Text className="text-base text-foreground-secondary">Track your progress</Text>
      </View>
    </SafeAreaView>
  );
}
