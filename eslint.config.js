const eslint = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '__mocks__/**', // Jest mocks (no type checking needed)
      '**/*.manual-test.ts', // Manual test helpers (not Jest tests)
      'src/lib/**', // Vendored third-party code (not our formatting)
    ],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // JavaScript/TypeScript config files (allow require, module, etc.)
  {
    files: [
      '**/*.config.js',
      '**/*.config.ts',
      '**/.eslintrc.js',
      '**/.prettierrc.js',
      'jest.*.js', // Jest config variants (jest.config.integration.js, etc.)
      'jest.*.ts', // Jest config variants TypeScript
    ],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off', // Config files can use require()
    },
  },

  // TypeScript and React files configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        // Node.js globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        // ES2022 globals
        Promise: 'readonly',
        console: 'readonly',
        // Timer functions
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // React Native globals
        __DEV__: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: react,
      'react-hooks': reactHooks,
      prettier: prettier,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript recommended rules
      ...tseslint.configs.recommended.rules,

      // React recommended rules
      ...react.configs.recommended.rules,

      // React Hooks rules
      ...reactHooks.configs.recommended.rules,

      // Prettier integration
      ...prettierConfig.rules,
      'prettier/prettier': 'warn',

      // React
      'react/react-in-jsx-scope': 'off', // Not needed with React 19
      'react/prop-types': 'off', // Using TypeScript

      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Test files configuration
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        // Jest globals
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        // Timer functions
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Browser globals (for JSDOM)
        window: 'readonly',
        document: 'readonly',
      },
    },
    rules: {
      // Allow console in tests
      'no-console': 'off',
      // Allow @ts-expect-error in tests
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },

  // Integration tests (fetch + any types for flexible mocking)
  {
    files: ['__tests__/integration/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        fetch: 'readonly', // Node.js 18+ native fetch (used in integration tests)
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Mock data flexibility
      '@typescript-eslint/no-namespace': 'off', // Jest custom matchers pattern
    },
  },

  // Network test helpers (any types for flexible mock data generation)
  {
    files: ['__tests__/__helpers__/network/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Mock data flexibility
    },
  },

  // Database test factories (any types for WatermelonDB create callbacks ONLY)
  {
    files: ['__tests__/__helpers__/database/factories.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // WatermelonDB limitation (untyped create callbacks)
    },
  },

  // Jest setup file (.js and .ts) - MUST come after general TypeScript config
  {
    files: ['jest.setup.ts'],
    languageOptions: {
      globals: {
        global: 'writable',
        console: 'writable',
        jest: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-namespace': 'off', // Custom matcher declarations
      '@typescript-eslint/no-empty-object-type': 'off', // Interface extensions
      'no-undef': 'off',
      'no-console': 'off', // Allow console in setup
    },
  },
];
