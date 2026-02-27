# Architecture Decision Records

This directory documents significant technical decisions for Halterofit using a lightweight [MADR](https://adr.github.io/madr/) format. Each ADR captures the context, decision, and consequences of an architectural choice.

## Adding a New ADR

1. Copy [TEMPLATE.md](TEMPLATE.md)
2. Number it sequentially (next available: 021)
3. Fill in all sections
4. Add it to the index table below
5. Link related ADRs bidirectionally

## Index

### Platform

| #                                 | Decision                        | Status   | Date    |
| --------------------------------- | ------------------------------- | -------- | ------- |
| [001](001-expo-dev-build.md)      | Expo SDK 54 + Development Build | Accepted | 2025-10 |
| [002](002-three-tier-testing.md)  | Three-Tier Testing Strategy     | Accepted | 2025-10 |
| [017](017-typescript-strict.md)   | TypeScript Strict Mode          | Accepted | 2025-10 |
| [018](018-expo-router.md)         | Expo Router                     | Accepted | 2025-10 |
| [019](019-eslint-prettier.md)     | ESLint + Prettier               | Accepted | 2025-10 |
| [020](020-github-actions-cicd.md) | GitHub Actions CI/CD            | Accepted | 2025-10 |

### Data

| #                                        | Decision                   | Status   | Date    |
| ---------------------------------------- | -------------------------- | -------- | ------- |
| [003](003-watermelondb-offline-first.md) | WatermelonDB Offline-First | Accepted | 2025-10 |
| [004](004-mmkv-encrypted-storage.md)     | MMKV Encrypted Storage     | Accepted | 2025-10 |
| [005](005-supabase-backend.md)           | Supabase Backend           | Accepted | 2025-10 |
| [006](006-rest-api-strategy.md)          | REST API Strategy          | Accepted | 2025-10 |
| [015](015-exercisedb-dataset.md)         | ExerciseDB Dataset         | Accepted | 2025-10 |

### UI

| #                                    | Decision               | Status   | Date    |
| ------------------------------------ | ---------------------- | -------- | ------- |
| [007](007-nativewind-v4.md)          | NativeWind v4 Styling  | Accepted | 2025-10 |
| [008](008-react-native-reusables.md) | React Native Reusables | Accepted | 2025-10 |
| [009](009-single-dark-mode.md)       | Single Dark Mode       | Accepted | 2025-10 |
| [010](010-expo-vector-icons.md)      | Expo Vector Icons      | Accepted | 2025-10 |

### Performance

| #                            | Decision              | Status   | Date    |
| ---------------------------- | --------------------- | -------- | ------- |
| [011](011-flashlist.md)      | FlashList             | Accepted | 2025-10 |
| [012](012-expo-image.md)     | expo-image Caching    | Accepted | 2025-10 |
| [013](013-victory-native.md) | Victory Native Charts | Accepted | 2025-10 |

### State

| #                     | Decision                 | Status   | Date    |
| --------------------- | ------------------------ | -------- | ------- |
| [014](014-zustand.md) | Zustand State Management | Accepted | 2025-10 |

### Monitoring

| #                               | Decision                | Status   | Date    |
| ------------------------------- | ----------------------- | -------- | ------- |
| [016](016-sentry-monitoring.md) | Sentry Error Monitoring | Accepted | 2025-10 |
