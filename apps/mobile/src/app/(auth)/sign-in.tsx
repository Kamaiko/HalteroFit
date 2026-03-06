/**
 * Sign In Screen (Placeholder)
 *
 * Structural placeholder for Phase 4 authentication implementation.
 * In __DEV__, provides a button to enable dev mode for testing.
 */

import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/layout';
import { Ionicons } from '@/components/ui/icon';
import { Colors, ICON_SIZE_3XL, BORDER_RADIUS_MD } from '@/constants';
import { enableDevMode } from '@/stores/auth/authStore';

export default function SignInScreen() {
  const handleDevMode = () => {
    enableDevMode();
    router.replace('/');
  };

  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center p-6">
        <Ionicons
          name="lock-closed-outline"
          size={ICON_SIZE_3XL}
          color={Colors.foreground.tertiary}
        />
        <Text className="text-3xl font-bold text-foreground mt-4 mb-2">Sign In</Text>
        <Text className="text-base text-foreground-secondary text-center">
          Authentication coming in Phase 4
        </Text>

        <Pressable
          onPress={handleDevMode}
          style={{
            backgroundColor: Colors.dev.banner,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: BORDER_RADIUS_MD,
            marginTop: 32,
          }}
        >
          <Text
            style={{
              color: Colors.primary.foreground,
              fontWeight: '600',
              fontSize: 14,
            }}
          >
            Continue as Dev User
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
