/**
 * ErrorFallbackScreen - Global error boundary fallback
 *
 * Displayed when an unhandled render error crashes the app.
 * Uses inline styles only — no NativeWind/className to avoid
 * depending on systems that may have also crashed.
 */

import { View, Text, Pressable } from 'react-native';
import { BORDER_RADIUS_MD, Colors } from '@/constants';

export function ErrorFallbackScreen() {
  const handleRestart = () => {
    // DevSettings.reload() works in dev builds
    // In production, expo-updates would handle this (added in Phase 5)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { DevSettings } = require('react-native');
      DevSettings.reload();
    } catch {
      // Production fallback — user must manually restart
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background.DEFAULT,
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: 16 }}>!</Text>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: Colors.foreground.DEFAULT,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        Something went wrong
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: Colors.foreground.secondary,
          textAlign: 'center',
          marginBottom: 24,
          lineHeight: 20,
        }}
      >
        The app encountered an unexpected error. Your data is safe — please restart the app.
      </Text>
      <Pressable
        onPress={handleRestart}
        style={{
          backgroundColor: Colors.primary.DEFAULT,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: BORDER_RADIUS_MD,
        }}
      >
        <Text style={{ color: Colors.primary.foreground, fontWeight: '600', fontSize: 16 }}>
          Restart App
        </Text>
      </Pressable>
    </View>
  );
}
