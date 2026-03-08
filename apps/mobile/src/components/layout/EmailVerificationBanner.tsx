/**
 * Email Verification Banner
 *
 * Shown when user.emailVerified === false.
 * Dismissible per session (not persisted).
 */

import { useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@/components/ui/icon';
import { Colors } from '@/constants';
import { resendVerificationEmail } from '@/services/auth';

export function EmailVerificationBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  if (dismissed) return null;

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      setResent(true);
    } catch {
      // Silent fail — not critical
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View
      style={{ backgroundColor: Colors.warning }}
      className="flex-row items-center justify-between px-3 py-2"
    >
      <View className="flex-1 flex-row items-center gap-2">
        <Ionicons name="warning-outline" size={16} color={Colors.foreground.inverse} />
        <Text style={{ color: Colors.foreground.inverse }} className="text-xs font-medium">
          {resent ? 'Verification email sent!' : 'Please verify your email'}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        {!resent && (
          <Pressable onPress={handleResend} disabled={isResending} hitSlop={8}>
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
        <Pressable onPress={() => setDismissed(true)} hitSlop={8}>
          <Ionicons name="close" size={16} color={Colors.foreground.inverse} />
        </Pressable>
      </View>
    </View>
  );
}
