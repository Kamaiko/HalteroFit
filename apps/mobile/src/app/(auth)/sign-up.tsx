/**
 * Sign Up Screen
 *
 * Email/password registration. On success, user is signed in immediately.
 * Email verification is non-blocking (reminder banner shown in app layout).
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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const wordmark = require('../../../assets/branding/wordmark.png') as number;
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Colors } from '@/constants';
import { signUp } from '@/services/auth';
import { getEmailError, getPasswordError, getPasswordConfirmError } from '@/utils/validators';
import { isOperationalError } from '@/utils/errors';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleSignUp = async () => {
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
    const confirmErr = getPasswordConfirmError(password, confirmPassword);
    if (confirmErr) {
      setError(confirmErr);
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password);
      router.replace('/');
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
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
              editable={!isLoading}
              placeholderTextColor={Colors.foreground.tertiary}
            />

            {error !== '' && <Text className="text-sm text-destructive text-center">{error}</Text>}

            <Button onPress={handleSignUp} disabled={isLoading} size="lg">
              {isLoading ? (
                <ActivityIndicator color={Colors.primary.foreground} />
              ) : (
                <Text>Create Account</Text>
              )}
            </Button>

            <Pressable onPress={() => router.push('/sign-in')} hitSlop={8}>
              <Text className="text-sm text-foreground-secondary text-center">
                Already have an account? <Text className="text-sm text-primary">Sign in</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
