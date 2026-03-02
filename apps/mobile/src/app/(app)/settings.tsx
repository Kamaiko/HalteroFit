import { Pressable, View, Text } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/layout';
import { Ionicons } from '@/components/ui/icon';
import { Colors, ICON_SIZE_MD, ICON_SIZE_3XL } from '@/constants';

export default function SettingsScreen() {
  return (
    <ScreenContainer>
      <View className="px-6 pt-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center bg-background-elevated"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={ICON_SIZE_MD} color={Colors.foreground.DEFAULT} />
        </Pressable>
      </View>
      <View className="flex-1 items-center justify-center p-6">
        <Ionicons name="cog-outline" size={ICON_SIZE_3XL} color={Colors.foreground.tertiary} />
        <Text className="text-3xl font-bold text-foreground mt-4 mb-2">Settings</Text>
        <Text className="text-base text-foreground-secondary">Customize your experience</Text>
      </View>
    </ScreenContainer>
  );
}
