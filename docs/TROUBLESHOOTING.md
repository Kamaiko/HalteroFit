# Troubleshooting

Solutions to common development issues with Halterofit. This guide covers the Development Build stack (WatermelonDB, MMKV, Victory Native, NativeWind) and typical error scenarios encountered during development.

**Quick Start**: Most issues are solved by clearing cache (`npm start -- --clear`) or rebuilding the Development Build.

## Table of Contents

- [Development Build Issues](#development-build-issues)
- [Metro Bundler Issues](#metro-bundler-issues)
- [Database Issues (WatermelonDB)](#database-issues-watermelondb)
- [Storage Issues (MMKV)](#storage-issues-mmkv)
- [Styling Issues (NativeWind)](#styling-issues-nativewind)
- [Authentication Issues (Supabase)](#authentication-issues-supabase)
- [TypeScript Errors](#typescript-errors)
- [Dependency Issues](#dependency-issues)
- [Performance Issues](#performance-issues)
- [Getting More Help](#getting-more-help)

---

## Development Build Issues

### App Not Installing or Using Expo Go

**Symptoms:**

- Can't find dev build app on device
- QR code opens Expo Go instead
- App icon is Expo Go logo (not Halterofit icon)

**Cause:**

Development Build not installed. This project requires native modules (WatermelonDB, MMKV, Victory Native) and **cannot use Expo Go**.

**Solution:**

```bash
# Build Development Build (first time, ~15-20 min)
eas build --profile development --platform android
# OR: eas build --profile development --platform ios

# Install on device
# 1. Scan QR code from EAS Build dashboard
# 2. OR download APK/IPA directly from EAS dashboard
```

**Verify Installation:**

- App icon should show Halterofit branding (NOT Expo Go)
- App name should be "Halterofit (dev)"

### App Crashes on Launch: "react context shouldn't be created before"

**Symptoms:**

- App crashes immediately on launch (Android emulator)
- Stack trace shows `IllegalArgumentException: App react context shouldn't be created before`
- Crash originates from `DevLauncherAppLoader.kt` (native layer)

**Cause:**

Stale Dev Client state on the emulator. Happens after hot reload, dev server restart, or interrupted sessions. This is a native Android issue, not a code bug.

**Solution:**

```bash
# Clear app data (keeps app installed)
adb shell pm clear com.halterofit.app

# Then relaunch
npm start
```

If that doesn't work:

```bash
# Uninstall and reinstall
adb uninstall com.halterofit.app
eas build --profile development --platform android
```

### When to Rebuild Development Build

You need to rebuild when:

- Adding npm packages with native code (e.g., `react-native-*`, `expo-*`)
- Modifying native configuration in `app.json`
- Updating Expo SDK version
- Changing native module settings

**Do NOT rebuild** for:

- JavaScript/TypeScript code changes (hot reload works)
- Styling changes
- Database schema changes (unless adding new native modules)

---

## Metro Bundler Issues

### Metro Won't Start

**Symptoms:**

- `npm start` fails
- "Port already in use" error
- Metro bundler shows persistent errors

**Solutions:**

```bash
# 1. Clear Metro cache
npm start -- --clear

# 2. Kill process using port 8081
# Windows:
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:8081 | xargs kill -9

# 3. Clear watchman cache (if installed)
watchman watch-del-all

# 4. Nuclear option - full clean
rm -rf node_modules
npm install
npm start -- --clear
```

### White Screen or "Unable to Connect"

**Symptoms:**

- White screen on device
- "Unable to connect to development server" error
- App opens but crashes immediately

**Solutions:**

```bash
# 1. Ensure Metro bundler is running
npm start

# 2. Reload app
# Shake device → "Reload"
# Or close app completely and reopen

# 3. Clear cache
npm start -- --clear
```

**Checklist:**

- [ ] Computer and phone on same WiFi network
- [ ] No VPN blocking connection
- [ ] Firewall allows port 8081
- [ ] Metro bundler running (check terminal output)

### Module Import Errors

**Symptoms:**

- `Invariant Violation: Module AppRegistry is not a registered callable module`
- Import errors for newly installed packages

**Solutions:**

```bash
# 1. Restart Metro with cache clear
npm start -- --clear

# 2. If still failing, reinstall dependencies
rm -rf node_modules
npm install

# 3. Verify import paths use @/ alias
```

**Common Mistakes:**

```typescript
// Bad: Relative imports
import { foo } from '../../../utils/foo';

// Good: Absolute imports with alias
import { foo } from '@/utils/foo';
```

**Reference:** [TECHNICAL.md § Import Paths](TECHNICAL.md)

---

## Database Issues (WatermelonDB)

### "Cannot Find Model" or Collection Errors

**Symptoms:**

- `Error: Cannot find model 'workouts'`
- `Collection 'workouts' not found`
- App crashes on database operations

**Cause:**

Model not registered in database instance or schema mismatch.

**Solution:**

```typescript
// Verify models are registered
// File: src/services/database/watermelon/index.ts
import { Workout, Exercise, WorkoutExercise, ExerciseSet } from '@/models';

const database = new Database({
  adapter,
  modelClasses: [
    Workout, // Must be registered
    Exercise,
    WorkoutExercise,
    ExerciseSet,
  ],
});

// Check import paths
import { Workout } from '@/models'; // ✅ Correct
```

**Reference:** [DATABASE.md § Schema](DATABASE.md)

### Schema Outdated / Migration Errors

**Symptoms:**

- `no such column` errors
- Missing tables or fields
- Type errors on database operations

**Cause:**

Schema version changed but old database still exists on device.

**Solution:**

```bash
# Option 1: Delete app and reinstall (recommended)
# Uninstall app from device, then reinstall dev build

# Option 2: Reset database (dev only - deletes ALL data)
```

```typescript
import { database } from '@/services/database/watermelon';

await database.write(async () => {
  await database.unsafeResetDatabase();
});
```

**⚠️ WARNING:** `unsafeResetDatabase()` deletes ALL local data. Development only.

**Reference:** [DATABASE.md § Migrations](DATABASE.md)

### Empty Queries / Data Not Loading

**Symptoms:**

- `database.collections.get('workouts').find(id)` throws error
- Queries return empty arrays
- Data exists but doesn't appear

**Common Causes:**

```typescript
// 1. User not authenticated
const userId = getPersistedUserId();
if (!userId) {
  console.log('User not authenticated - cannot query');
}

// 2. Using find() for non-existent records
try {
  const workout = await workoutsCollection.find('invalid-id');
  // ❌ Throws if not found
} catch (error) {
  console.log('Workout not found');
}

// Better: Use query
const workouts = await workoutsCollection.query(Q.where('id', 'some-id')).fetch();

if (workouts.length === 0) {
  console.log('Workout not found');
}

// 3. Reactive queries not updating
// Use .observe() for reactive queries
const workouts$ = workoutsCollection.query().observe(); // Returns Observable
```

**Debugging:**

```typescript
// Check total records
const total = await database.collections.get('workouts').query().fetchCount();
console.log('Total workouts:', total);

// Enable WatermelonDB logging
import { Database } from '@nozbe/watermelondb';
Database.setLogLevel('verbose');
```

---

## Storage Issues (MMKV)

### "MMKV Not Found" Error

**Symptoms:**

- `Error: MMKV native module not found`
- App crashes when accessing storage
- `mmkvStorage.get()` throws error

**Cause:**

Using Expo Go instead of Development Build. MMKV is a native module.

**Solution:**

```bash
# 1. Verify using Development Build (NOT Expo Go)
# Check app icon - should NOT be Expo Go logo

# 2. Rebuild Development Build if needed
eas build --profile development --platform android

# 3. Clear cache and restart
npm start -- --clear
```

### Data Not Persisting Across Restarts

**Symptoms:**

- `mmkvStorage.set()` works but data lost after restart
- `mmkvStorage.get()` returns null after app reload

**Solution:**

```typescript
// 1. Verify data is being set
mmkvStorage.set('test-key', 'test-value');
const value = mmkvStorage.get('test-key');
console.log('Value:', value); // Should be 'test-value'

// 2. Check Zustand persist configuration
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/services/storage';

export const useStore = create(
  persist(
    (set) => ({
      /* state */
    }),
    {
      name: 'my-storage-key', // Unique key for this store
      storage: createJSONStorage(() => zustandMMKVStorage), // ✅ Correct
    }
  )
);
```

**Reference:** [ARCHITECTURE.md § Storage](ARCHITECTURE.md)

---

## Styling Issues (NativeWind)

### Tailwind Classes Not Working

**Symptoms:**

- `className="..."` has no effect
- Styles not applied
- Layout broken

**Solutions:**

```bash
# 1. Restart Metro with cache clear
npm start -- --clear

# 2. Verify global.css is imported
# Check src/app/_layout.tsx
```

```typescript
// src/app/_layout.tsx
import '../../global.css'; // Must be imported in root layout
```

**Common Mistakes:**

```typescript
// ❌ Wrong: Mixing style prop with className
<View style={{ padding: 20 }} className="bg-primary" />

// ✅ Right: Use Tailwind classes only
<View className="p-5 bg-primary" />

// ❌ Wrong: Invalid class names
<View className="padding-20" />

// ✅ Right: Valid Tailwind syntax
<View className="p-5" />
```

**Reference:** [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)

### Theme Colors Not Matching

**Symptoms:**

- Colors look wrong
- Inconsistent styling across app
- Chart colors don't match theme

**Cause:**

Mismatch between `src/constants/colors.ts` and `tailwind.config.ts`.

**Solution:**

```typescript
// src/constants/colors.ts
export const Colors = {
  primary: {
    DEFAULT: '#4299e1', // MUST match tailwind.config.ts
  },
};

// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4299e1', // MUST match Colors.ts
        },
      },
    },
  },
};
```

**Checklist:**

- [ ] Colors match between `colors.ts` and `tailwind.config.ts`
- [ ] Using `Colors` export (not `COLORS`)
- [ ] Importing from `@/constants`

**Reference:** [DESIGN_SYSTEM.md § Color System](DESIGN_SYSTEM.md)

### Components Render at 0 Size (NativeWind CSS Interop)

**Symptoms:**

- Component renders but is invisible (0×0 size)
- GIFs, images, or entire layout sections disappear
- Works with inline `style` but breaks with `className`

**Cause:**

Not all React Native components support NativeWind v4 CSS interop. Using `className` on these components silently fails — the styles are ignored and the component renders with no dimensions.

**Known non-interop components:**

| Component                | Package                        | Use `style` for               |
| ------------------------ | ------------------------------ | ----------------------------- |
| `Image`                  | `expo-image`                   | `width`, `height`, all layout |
| `GestureHandlerRootView` | `react-native-gesture-handler` | `flex`, `backgroundColor`     |
| `LinearGradient`         | `expo-linear-gradient`         | All props (uses `style`)      |

**Example:**

```tsx
// ❌ Wrong: expo-image Image has no CSS interop — renders at 0×0
<Image source={{ uri: gifUrl }} className="h-full w-full" />

// ✅ Right: Use inline style
<Image source={{ uri: gifUrl }} style={{ width: '100%', height: '100%' }} />

// ❌ Wrong: GestureHandlerRootView has no CSS interop
<GestureHandlerRootView className="flex-1 bg-background">

// ✅ Right: Use inline style
<GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background.DEFAULT }}>
```

**Rule of thumb:** Before converting an inline `style` to NativeWind `className`, verify the component supports CSS interop. Standard React Native components (`View`, `Text`, `Pressable`, `ScrollView`) and Reanimated's `Animated.View` all support it. Third-party components generally do not unless explicitly documented.

**Reference:** [NativeWind v4 — CSS Interop](https://www.nativewind.dev/v4/core-concepts/css-interop)

---

## Authentication Issues (Supabase)

### "Invalid API Key" Error

**Symptoms:**

- `Supabase client error: Invalid API key`
- Auth operations fail immediately

**Solutions:**

```bash
# 1. Verify .env file exists
ls -la .env

# 2. Check credentials in Supabase Dashboard
# Dashboard → Settings → API
# Copy EXACT values (no spaces, quotes, etc.)

# 3. Restart Metro (env changes require restart)
# Kill Metro (Ctrl+C)
npm start -- --clear
```

**Common Mistakes:**

```bash
# ❌ Wrong: Quotes in .env
EXPO_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"

# ✅ Right: No quotes
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co

# ❌ Wrong: Missing EXPO_PUBLIC_ prefix
SUPABASE_URL=https://xxx.supabase.co

# ✅ Right: Correct prefix for Expo
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
```

**Verification:**

```typescript
// Temporarily add to src/app/_layout.tsx
console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
// Should print full URL (not undefined)
```

### User Session Not Persisting

**Solution:**

Zustand persist middleware is configured for auth and workout stores. User session persists using MMKV storage.

**Verify:**

```typescript
import { storage } from '@/services/storage';

const userId = await storage.getString('auth:user_id');
console.log('Persisted user ID:', userId);
```

If `userId` is null after login, check MMKV configuration.

---

## TypeScript Errors

### "Cannot Find Name" / Import Errors

**Symptoms:**

- TypeScript can't find imports
- `Cannot find name 'Colors'`
- VSCode shows red squiggles

**Solutions:**

```bash
# 1. Restart TypeScript server (VSCode)
# Cmd+Shift+P (macOS) or Ctrl+Shift+P (Windows)
# → "TypeScript: Restart TS Server"

# 2. Run type check
npm run type-check

# 3. Verify import paths
```

```typescript
// ❌ Bad: Direct file imports
import { Colors } from '@/constants/colors';

// ✅ Good: Barrel exports
import { Colors } from '@/constants';
```

**Reference:** [TECHNICAL.md § TypeScript Configuration](TECHNICAL.md)

### Type Errors After Code Changes

**Always run after making changes:**

```bash
npm run type-check
```

**Common Issues:**

- Missing exports in `index.ts` barrel files
- Incorrect type imports (`import type` vs regular `import`)
- Circular dependencies

**Reference:** [TECHNICAL.md § Coding Standards](TECHNICAL.md)

---

## Dependency Issues

### "Cannot Find Module" After Install

**Symptoms:**

- `Error: Cannot find module 'some-package'`
- Package installed but not found

**Solutions:**

```bash
# 1. Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 2. Restart Metro
npm start -- --clear

# 3. Verify package in package.json
cat package.json | grep "package-name"
```

### Peer Dependency Warnings

**Symptoms:**

- `npm install` shows peer dependency warnings
- Version conflicts

**Solution:**

```bash
# Use legacy peer deps (safe for Expo projects)
npm install --legacy-peer-deps

# Expo manages React Native version internally
```

---

## Performance Issues

### App Slow or Laggy

**Symptoms:**

- UI feels sluggish
- Animations choppy
- Long loading times

**Debugging:**

```typescript
// 1. Check query performance
const start = Date.now();
await getWorkoutById(id);
console.log('Query took:', Date.now() - start, 'ms');

// 2. Enable performance monitoring
import { InteractionManager } from 'react-native';

InteractionManager.runAfterInteractions(() => {
  console.log('Interactions complete');
});
```

**Common Causes:**

- Slow database queries (missing indexes)
- Too many re-renders
- Large lists without FlashList
- Unoptimized images

**Reference:** [TESTING.md § Performance Testing](TESTING.md)

---

## Getting More Help

If your issue isn't listed here:

1. **Search Metro logs** - Error messages often explain the root cause
2. **Check recent commits** for similar fixes:
   ```bash
   git log --grep="fix" --oneline
   ```
3. **Consult related documentation:**
   - [DATABASE.md](DATABASE.md) - Database operations
   - [TECHNICAL.md](TECHNICAL.md) - Technical decisions
   - [ARCHITECTURE.md](ARCHITECTURE.md) - Code structure

**Community:**

- GitHub Issues: Report bugs or request features
- GitHub Discussions: Ask questions

**Contributing:**

Found and fixed a new issue? Update this guide to help others.
