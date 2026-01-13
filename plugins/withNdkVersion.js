/* global require, module */
/**
 * Expo Config Plugin: withNdkVersion
 *
 * Forces a specific Android NDK version in gradle.properties.
 * This is necessary because expo-modules-autolinking defaults to NDK 27,
 * which causes STL linking errors on Windows with SDK 53.
 *
 * @see https://docs.expo.dev/guides/config-plugins/
 */
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * @param {import('expo/config-plugins').ExpoConfig} config
 * @param {{ ndkVersion?: string }} options
 */
const withNdkVersion = (config, { ndkVersion = '26.1.10909125' } = {}) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const gradlePropertiesPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle.properties'
      );

      let content = fs.readFileSync(gradlePropertiesPath, 'utf-8');

      // Remove any existing android.ndkVersion line
      content = content
        .split('\n')
        .filter((line) => !line.startsWith('android.ndkVersion='))
        .join('\n');

      // Add the NDK version at the end
      content +=
        '\n# Force NDK 26 for SDK 53 compatibility (NDK 27 causes STL linking errors on Windows)\n';
      content += `android.ndkVersion=${ndkVersion}\n`;

      fs.writeFileSync(gradlePropertiesPath, content);

      return config;
    },
  ]);
};

module.exports = withNdkVersion;
