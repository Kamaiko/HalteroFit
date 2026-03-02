import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center p-5 bg-background">
      <Text className="text-3xl font-bold text-foreground mb-2">Oops!</Text>
      <Text className="text-lg text-foreground-secondary mb-6">
        This screen doesn&apos;t exist.
      </Text>
      <Link href="/" className="mt-4 py-4">
        <Text className="text-base text-primary underline">Go to home screen!</Text>
      </Link>
    </View>
  );
}
