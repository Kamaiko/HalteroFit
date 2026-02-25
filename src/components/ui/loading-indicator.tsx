import { ActivityIndicator, View } from 'react-native';
import { Colors } from '@/constants';

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
}

export function LoadingIndicator({ size = 'large' }: LoadingIndicatorProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size={size} color={Colors.primary.DEFAULT} />
    </View>
  );
}
