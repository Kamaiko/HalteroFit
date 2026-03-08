/**
 * Email Verification Banner
 *
 * Persistent banner shown when user.emailVerified === false.
 * Non-dismissable — disappears only when email is verified.
 */

import { useEffect, useRef, useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@/components/ui/icon';
import { Colors } from '@/constants';
import { resendVerificationEmail } from '@/services/auth';

const COOLDOWN_SECONDS = 60;

export function EmailVerificationBanner() {
  const insets = useSafeAreaInsets();
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Countdown timer — ticks every second while cooldown > 0
  useEffect(() => {
    if (cooldown <= 0) return;
    intervalRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [cooldown > 0]);

  const handleResend = async () => {
    setIsResending(true);
    setError(false);
    setResent(false);
    try {
      await resendVerificationEmail();
      setResent(true);
      timeoutRef.current = setTimeout(() => setResent(false), 3000);
    } catch {
      setError(true);
      timeoutRef.current = setTimeout(() => setError(false), 3000);
    } finally {
      setIsResending(false);
      setCooldown(COOLDOWN_SECONDS);
    }
  };

  const message = error
    ? 'Failed to send — try again'
    : resent
      ? 'Verification email sent!'
      : 'Please verify your email';

  const showButton = !resent && !error && cooldown <= 0;

  return (
    <View
      style={{ backgroundColor: Colors.warning, paddingTop: insets.top }}
      className="flex-row items-center justify-between px-4 py-1.5"
    >
      <View className="flex-1 flex-row items-center gap-2">
        <Ionicons name="warning-outline" size={16} color={Colors.foreground.inverse} />
        <Text style={{ color: Colors.foreground.inverse }} className="text-xs font-medium">
          {message}
        </Text>
      </View>
      {cooldown > 0 && !resent && !error && (
        <Text style={{ color: Colors.foreground.inverse }} className="text-xs opacity-70">
          Resend in {cooldown}s
        </Text>
      )}
      {showButton && (
        <Pressable
          onPress={handleResend}
          disabled={isResending}
          hitSlop={12}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          {isResending ? (
            <ActivityIndicator size="small" color={Colors.foreground.inverse} />
          ) : (
            <Text
              style={{ color: Colors.foreground.inverse }}
              className="text-xs font-semibold underline"
            >
              Resend
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}
