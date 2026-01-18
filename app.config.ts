import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamic Expo configuration
 *
 * This file extends app.json and adds:
 * - Config plugins (withNdkVersion for Android NDK compatibility)
 * - Future: Environment-specific configuration (process.env)
 *
 * app.json = Static base config (readable by external tools)
 * app.config.ts = Dynamic extensions (plugins, env vars, conditionals)
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  // Ensure required fields from app.json are present
  if (!config.name || !config.slug) {
    throw new Error('app.json must define name and slug');
  }

  return {
    // Inherit everything from app.json
    ...config,
    name: config.name,
    slug: config.slug,

    // Plugins are defined here (not in app.json) because:
    // 1. Plugin paths are resolved relative to this file
    // 2. Future plugins may need dynamic configuration
    plugins: [
      'expo-router',
      '@sentry/react-native',
      'expo-asset',
      // NDK plugin disabled for SDK 54 - uses NDK 28 by default
      // ['./plugins/withNdkVersion', { ndkVersion: '26.1.10909125' }],
    ],

    // Preserve extra config from app.json and extend if needed
    extra: {
      ...config.extra,
      // Future: Add environment-specific values here
      // apiUrl: process.env.EXPO_PUBLIC_API_URL,
    },
  };
};
