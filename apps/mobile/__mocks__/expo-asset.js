// Manual mock for expo-asset
// This allows tests to run without the actual Expo native module

const Asset = {
  fromModule: jest.fn(() => ({
    downloadAsync: jest.fn(() => Promise.resolve()),
    uri: 'mock-asset-uri',
  })),
};

module.exports = {
  Asset,
};
