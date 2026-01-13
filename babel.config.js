module.exports = function (api) {
  api.cache(true);

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      // WatermelonDB decorators support
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      // Reanimated 4 uses worklets plugin (must be listed last)
      'react-native-worklets/plugin',
    ],
  };
};
