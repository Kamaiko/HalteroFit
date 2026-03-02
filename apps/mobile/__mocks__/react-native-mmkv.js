// Manual mock for react-native-mmkv
// This allows tests to run without the actual React Native module

const mockStorage = {};

const mockMMKV = {
  set: jest.fn((key, value) => {
    mockStorage[key] = value;
  }),
  getString: jest.fn((key) => mockStorage[key] || undefined),
  getNumber: jest.fn((key) => {
    const value = mockStorage[key];
    return value !== undefined ? Number(value) : undefined;
  }),
  getBoolean: jest.fn((key) => {
    const value = mockStorage[key];
    return value !== undefined ? Boolean(value) : undefined;
  }),
  delete: jest.fn((key) => {
    delete mockStorage[key];
  }),
  clearAll: jest.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
  getAllKeys: jest.fn(() => Object.keys(mockStorage)),
  contains: jest.fn((key) => key in mockStorage),
};

const createMMKV = jest.fn(() => mockMMKV);

module.exports = {
  MMKV: mockMMKV,
  createMMKV,
};
