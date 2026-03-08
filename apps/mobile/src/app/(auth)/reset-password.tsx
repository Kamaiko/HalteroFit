/**
 * Reset Password Screen
 *
 * Deep link target for halterofit://reset-password.
 * User arrives here after clicking the reset link in their email.
 * They have a temporary session from createSessionFromUrl().
 */

import { useRef, useState } from 'react';
import {
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/layout';
import { Ionicons } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Colors, ICON_SIZE_3XL } from '@/constants';
import { updatePassword } from '@/services/auth';
import { getPasswordError, getPasswordConfirmError } from '@/utils/validators';
import { isOperationalError } from '@/utils/errors';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const confirmRef = useRef<TextInput>(null);

  const handleUpdatePassword = async () => {
    setError('');

    const passwordErr = getPasswordError(password);
    if (passwordErr) {
      setError(passwordErr);
      return;
    }
    const confirmErr = getPasswordConfirmError(password, confirmPassword);
    if (confirmErr) {
      setError(confirmErr);
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(password);
      setIsSuccess(true);
    } catch (err) {
      setError(
        isOperationalError(err) ? err.userMessage : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center px-6">
          {isSuccess ? (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={ICON_SIZE_3XL}
                color={Colors.success}
              />
              <Text variant="h3" className="mt-4 mb-4 border-b-0">
                Password Updated!
              </Text>
              <Pressable onPress={() => router.replace('/sign-in')} hitSlop={8}>
                <Text className="text-sm text-primary">Go to Sign In</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Ionicons
                name="lock-open-outline"
                size={ICON_SIZE_3XL}
                color={Colors.primary.DEFAULT}
              />
              <Text variant="h3" className="mt-4 mb-6 border-b-0">
                Set New Password
              </Text>

              <View className="w-full max-w-sm gap-4">
                <View className="relative">
                  <Input
                    placeholder="New Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                    editable={!isLoading}
                    placeholderTextColor={Colors.foreground.tertiary}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-0 bottom-0 justify-center"
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={Colors.foreground.tertiary}
                    />
                  </Pressable>
                </View>
                <Input
                  ref={confirmRef}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={handleUpdatePassword}
                  editable={!isLoading}
                  placeholderTextColor={Colors.foreground.tertiary}
                />

                {error !== '' && (
                  <Text className="text-sm text-destructive text-center">{error}</Text>
                )}

                <Button onPress={handleUpdatePassword} disabled={isLoading} size="lg">
                  {isLoading ? (
                    <ActivityIndicator color={Colors.primary.foreground} />
                  ) : (
                    <Text>Update Password</Text>
                  )}
                </Button>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
