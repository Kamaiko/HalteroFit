/* global require, module */
/**
 * Expo Config Plugin: withNdkVersion
 *
 * Forces a specific Android NDK version by:
 * 1. Setting ext.ndkVersion in build.gradle BEFORE expo-root-project plugin
 * 2. Setting android.ndkVersion in gradle.properties as backup
 * 3. Modifying app/build.gradle to read from gradle.properties
 *
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
      const platformRoot = config.modRequest.platformProjectRoot;

      // 1. Update root build.gradle to set ext.ndkVersion BEFORE expo-root-project plugin
      const rootBuildGradlePath = path.join(platformRoot, 'build.gradle');
      let rootBuildContent = fs.readFileSync(rootBuildGradlePath, 'utf-8');

      // Check if ext.ndkVersion already exists
      if (!rootBuildContent.includes('ext.ndkVersion')) {
        // Insert ext.ndkVersion before 'apply plugin: "expo-root-project"'
        const insertPoint = 'apply plugin: "expo-root-project"';
        const ndkExtBlock = `// Force NDK 26 for SDK 53 compatibility (NDK 27 causes STL linking errors on Windows)
// Must be set BEFORE expo-root-project plugin which defaults to NDK 27
ext.ndkVersion = "${ndkVersion}"

`;
        rootBuildContent = rootBuildContent.replace(insertPoint, ndkExtBlock + insertPoint);
        fs.writeFileSync(rootBuildGradlePath, rootBuildContent);
      }

      // 2. Update gradle.properties with NDK version (backup)
      const gradlePropertiesPath = path.join(platformRoot, 'gradle.properties');
      let propsContent = fs.readFileSync(gradlePropertiesPath, 'utf-8');

      // Remove any existing android.ndkVersion line
      propsContent = propsContent
        .split('\n')
        .filter((line) => !line.startsWith('android.ndkVersion='))
        .join('\n');

      // Add the NDK version at the end
      propsContent +=
        '\n# Force NDK 26 for SDK 53 compatibility (NDK 27 causes STL linking errors on Windows)\n';
      propsContent += `android.ndkVersion=${ndkVersion}\n`;

      fs.writeFileSync(gradlePropertiesPath, propsContent);

      // 3. Update app/build.gradle to read NDK from gradle.properties
      const buildGradlePath = path.join(platformRoot, 'app', 'build.gradle');
      let buildContent = fs.readFileSync(buildGradlePath, 'utf-8');

      // Replace ndkVersion line to use findProperty with fallback
      const oldNdkLine = 'ndkVersion rootProject.ext.ndkVersion';
      const newNdkLine =
        "// Use NDK version from gradle.properties if defined, otherwise fall back to Expo default\n    ndkVersion findProperty('android.ndkVersion') ?: rootProject.ext.ndkVersion";

      if (buildContent.includes(oldNdkLine)) {
        buildContent = buildContent.replace(oldNdkLine, newNdkLine);
        fs.writeFileSync(buildGradlePath, buildContent);
      }

      return config;
    },
  ]);
};

module.exports = withNdkVersion;
