import { Text } from 'react-native';
import { ScreenContainer } from '@/components/layout';

export default function ProgressScreen() {
  return (
    <ScreenContainer contentClassName="items-center justify-center p-6">
      <Text className="text-3xl font-bold text-foreground mb-2">Progress</Text>
      <Text className="text-base text-foreground-secondary">Track your training over time</Text>
    </ScreenContainer>
  );
}
