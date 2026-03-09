/**
 * Sign In Screen
 *
 * Email/password authentication with dev mode fallback.
 */

import { useRef, useState } from 'react';
import {
  View,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/layout';
import { Ionicons } from '@/components/ui/icon';
import { BrandIcon } from '@/components/ui/brand-icon';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Colors, BORDER_RADIUS_MD } from '@/constants';
import { enableDevMode } from '@/stores/auth/authStore';
import { signIn } from '@/services/auth';
import { resolveInitialSync } from '@/services/database';
import { getEmailError, getPasswordError } from '@/utils/validators';
import { isOperationalError } from '@/utils/errors';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const wordmark = require('../../../assets/branding/wordmark.png') as number;

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const handleSignIn = async () => {
    setError('');

    const emailErr = getEmailError(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    const passwordErr = getPasswordError(password);
    if (passwordErr) {
      setError(passwordErr);
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (err) {
      setError(
        isOperationalError(err) ? err.userMessage : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevMode = () => {
    enableDevMode();
    resolveInitialSync(); // No real sync in dev mode
    router.replace('/');
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 items-center pt-52 px-6">
          <BrandIcon size={80} color="#fff" />
          {/* HALTEROFIT wordmark */}
          <Image
            source={wordmark}
            style={{ width: 240, height: 40, marginTop: 12, marginBottom: 24 }}
            resizeMode="contain"
          />

          <View className="w-full max-w-sm gap-4">
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!isLoading}
              placeholderTextColor={Colors.foreground.tertiary}
            />
            <View className="relative">
              <Input
                ref={passwordRef}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
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

            {error !== '' && <Text className="text-sm text-destructive text-center">{error}</Text>}

            <Button onPress={handleSignIn} disabled={isLoading} size="lg">
              {isLoading ? (
                <ActivityIndicator color={Colors.primary.foreground} />
              ) : (
                <Text>Sign In</Text>
              )}
            </Button>

            <Pressable onPress={() => router.push('/forgot-password')} hitSlop={8}>
              <Text className="text-sm text-primary text-center">Forgot password?</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/sign-up')} hitSlop={8}>
              <Text className="text-sm text-foreground-secondary text-center">
                Don&apos;t have an account? <Text className="text-sm text-primary">Sign up</Text>
              </Text>
            </Pressable>
          </View>

          {(__DEV__ || process.env.EXPO_PUBLIC_ENABLE_MOCK_AUTH === 'true') && (
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
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
