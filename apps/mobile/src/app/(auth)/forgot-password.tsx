/**
 * Forgot Password Screen
 *
 * Sends a password reset link to the user's email.
 * Always shows success state (no email enumeration).
 */

import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/layout';
import { Ionicons } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Colors, ICON_SIZE_3XL } from '@/constants';
import { resetPassword } from '@/services/auth';
import { getEmailError } from '@/utils/validators';
import { isOperationalError } from '@/utils/errors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = async () => {
    setError('');

    const emailErr = getEmailError(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      setIsSent(true);
    } catch (err) {
      // Still show success to prevent email enumeration,
      // unless it's a network/availability error
      if (isOperationalError(err) && (err.code === 'NETWORK_ERROR' || err.code === 'AUTH_UNAVAILABLE')) {
        setError(err.userMessage);
      } else {
        setIsSent(true);
      }
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
        <View className="flex-1 px-6">
          <Pressable onPress={() => router.back()} className="mt-4" hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={Colors.foreground.DEFAULT} />
          </Pressable>

          <View className="flex-1 items-center justify-center">
            {isSent ? (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={ICON_SIZE_3XL}
                  color={Colors.success}
                />
                <Text variant="h3" className="mt-4 mb-4 border-b-0">
                  Check Your Email
                </Text>
                <Text className="text-base text-foreground-secondary text-center max-w-xs">
                  We sent a reset link to {email.trim()}. It expires in 1 hour.
                </Text>
                <Pressable onPress={() => router.push('/sign-in')} className="mt-6" hitSlop={8}>
                  <Text className="text-sm text-primary">Back to Sign In</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Ionicons
                  name="mail-outline"
                  size={ICON_SIZE_3XL}
                  color={Colors.primary.DEFAULT}
                />
                <Text variant="h3" className="mt-4 mb-2 border-b-0">
                  Reset Password
                </Text>
                <Text className="text-sm text-foreground-secondary text-center mb-6 max-w-xs">
                  Enter your email and we'll send you a reset link.
                </Text>

                <View className="w-full max-w-sm gap-4">
                  <Input
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                    editable={!isLoading}
                    placeholderTextColor={Colors.foreground.tertiary}
                  />

                  {error !== '' && (
                    <Text className="text-sm text-destructive text-center">{error}</Text>
                  )}

                  <Button onPress={handleResetPassword} disabled={isLoading} size="lg">
                    {isLoading ? (
                      <ActivityIndicator color={Colors.primary.foreground} />
                    ) : (
                      <Text>Send Reset Link</Text>
                    )}
                  </Button>
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
