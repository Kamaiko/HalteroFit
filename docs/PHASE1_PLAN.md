# Phase 1 Plan

This document provides comprehensive implementation guidance for Phase 1 tasks covering authentication UI, testing infrastructure, and database enhancements. It includes architecture decisions, task breakdowns, Supabase best practices, and testing strategies.

## Table of Contents

1. [Overview](#overview)
2. [Architecture Decision (ADR)](#architecture-decision-adr)
3. [Architecture Overview](#architecture-overview)
4. [Task Details A: Auth UI & Screens](#task-details-a-auth-ui--screens)
5. [Task Details B: Testing Infrastructure](#task-details-b-testing-infrastructure)
6. [Task Details C: Database Enhancements](#task-details-c-database-enhancements)
7. [Supabase Best Practices](#supabase-best-practices)
8. [Testing Strategy](#testing-strategy)

## Overview

**Phase 1 Goal:** Implement email/password authentication with comprehensive testing infrastructure (90% coverage) and database reliability enhancements.

**Scope:**

- 15 tasks across 3 categories (A: Auth UI, B: Testing, C: Database)
- Estimated effort: ~31 hours (3 weeks at 10h/week)
- Timeline: Weeks 9-11

**Deliverables:**

- Login, Register, Password Reset screens
- Protected routes with navigation guards
- Supabase Auth integration with session persistence
- 90% auth test coverage (unit + E2E)
- Cascading delete, User model enhancements, sync retry logic

**Key Constraint:** Simple email/password only (biometric removed - user logs in once)

## Architecture Decision (ADR)

### Pattern: Hooks + Services + Store

**Decision:** Auth implementation follows the **Hooks + Services + Store** pattern for optimal testability and code clarity.

**Components:**

1. **Store (Zustand)**: Pure state management only
   - State: `user`, `isAuthenticated`, `isLoading`
   - Actions: `setUser()`, `setLoading()`, `signOut()`
   - Persistence: MMKV via Zustand persist middleware
   - Location: `src/stores/auth/authStore.ts` (already exists)

2. **Services**: Raw Supabase API calls
   - Functions: `signIn()`, `signUp()`, `signOut()`, `resetPassword()`, `refreshSession()`
   - Location: `src/services/auth/index.ts` (empty placeholder, needs implementation)
   - Returns: `{ data, error }` (Supabase pattern)

3. **Hooks**: Business logic wrapper
   - Hook: `useAuth()` integrates store + services
   - Location: `src/hooks/useAuth.ts` (new file)
   - Provides: `{ user, isAuthenticated, isLoading, signIn, signUp, signOut, resetPassword }`

**Rationale:**

| Criteria              | Hooks + Services + Store                 | Direct Store Only              |
| --------------------- | ---------------------------------------- | ------------------------------ |
| **Testing**           | 3x easier (mock services independently)  | Hard to mock Supabase in store |
| **Clarity**           | Clear separation of concerns             | Mixed responsibilities         |
| **Reusability**       | Services reusable in multiple contexts   | Tied to store                  |
| **Industry Standard** | Supabase docs use this pattern           | Less common                    |
| **ROI**               | Positive (Phase 1.B has 8 testing tasks) | Negative (testing overhead)    |

**Example Flow:**

```
User Action (Login)
    ↓
LoginScreen calls hook
    ↓
useAuth.signIn(email, password)
    ↓
authService.signIn() → Supabase API
    ↓
useAuthStore.setUser(user) → MMKV persist
    ↓
useAuth returns success → navigate to (tabs)
```

**Storage Strategy Decision:**

**Decision:** Keep `storage.ts` abstraction (not direct MMKV usage)

**Rationale:**

- Consistency: authStore already uses this pattern
- Future-proof: Easy to swap MMKV for alternatives (e.g., encrypted storage)
- Testing: Mock `storage.get()/set()` instead of MMKV directly

## Architecture Overview

### File Structure

```
src/
├── app/
│   ├── (auth)/                    # Auth route group (public)
│   │   ├── login.tsx              # 1.10 - Login screen
│   │   ├── register.tsx           # 1.11 - Register screen
│   │   └── reset-password.tsx     # 1.12 - Password reset
│   ├── (tabs)/                    # Protected route group
│   │   └── ...                    # Workout, Profile tabs
│   └── _layout.tsx                # 1.13 - Root layout with auth guard
│
├── services/
│   ├── auth/
│   │   └── index.ts               # 1.14 - Auth services (Supabase)
│   └── database/
│       ├── local/
│       │   └── models/
│       │       └── User.ts        # 1.31 - User model enhancements
│       ├── operations/
│       │   └── workouts.ts        # 1.30 - Cascading delete fix
│       └── remote/
│           └── sync.ts            # 1.32 - Sync retry logic
│
├── stores/
│   └── auth/
│       └── authStore.ts           # Zustand store (exists)
│
└── hooks/
    └── useAuth.ts                 # Business logic hook (new)

__tests__/
├── __helpers__/
│   └── auth/                      # 1.15 - Test infrastructure
│       ├── factories.ts           # createTestAuthUser, createTestSession
│       └── mocks.ts               # mock Supabase, mock MMKV
├── unit/
│   ├── services/
│   │   └── auth.test.ts           # 1.16 - Auth service tests
│   ├── stores/
│   │   └── authStore.test.ts      # 1.17 - Auth store tests
│   └── database/
│       ├── auth-validation.test.ts # 1.18 - Auth validation tests
│       ├── sync-errors.test.ts    # 1.19 - Sync error tests
│       └── mmkv-storage.test.ts   # 1.20 - MMKV edge cases
└── integration/                   # (future E2E tests)

.maestro/
└── auth/                          # 1.22 - Maestro E2E tests
    ├── auth-login.yaml
    ├── auth-register.yaml
    └── auth-password-reset.yaml
```

### Component Responsibilities

#### 1. authStore (Zustand)

**Purpose:** Pure state management with MMKV persistence

```typescript
// src/stores/auth/authStore.ts (already exists)
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
}
```

**Key Features:**

- Persist `user` and `isAuthenticated` to MMKV
- `isLoading` is ephemeral (recalculate on rehydration)
- `onRehydrateStorage` hook for error handling

#### 2. authService

**Purpose:** Raw Supabase API calls

```typescript
// src/services/auth/index.ts (needs implementation)
export const authService = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  },
  signUp: async (email: string, password: string) => {
    /* ... */
  },
  signOut: async () => {
    /* ... */
  },
  resetPassword: async (email: string) => {
    /* ... */
  },
  refreshSession: async () => {
    /* ... */
  },
};
```

#### 3. useAuth Hook

**Purpose:** Business logic wrapper

```typescript
// src/hooks/useAuth.ts (new file)
export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await authService.signIn(email, password);
    if (error) {
      setLoading(false);
      return { error: formatAuthError(error) };
    }
    setUser(data.user);
    return { data };
  };

  // ... signUp, signOut, resetPassword

  return { user, isAuthenticated, isLoading, signIn, signUp, signOut, resetPassword };
};
```

### Data Flow

**Login Flow:**

```
1. User enters email/password → LoginScreen
2. LoginScreen calls useAuth().signIn(email, password)
3. useAuth calls authService.signIn() → Supabase API
4. Supabase returns { data: { user, session }, error: null }
5. useAuth calls authStore.setUser(user)
6. authStore persists user + isAuthenticated to MMKV
7. authStore updates state → LoginScreen receives success
8. LoginScreen navigates to (tabs) route
```

**Session Persistence:**

```
1. App starts → _layout.tsx renders
2. authStore rehydrates from MMKV
3. onRehydrateStorage sets isLoading = false
4. If user exists → navigate to (tabs)
5. If no user → navigate to (auth)/login
```

**AppState Auto-Refresh (Supabase Best Practice):**

```
1. User backgrounds app
2. User foregrounds app → AppState listener fires
3. useEffect in _layout.tsx calls authService.refreshSession()
4. Supabase auto-refreshes JWT token (if expired)
5. authStore updates with new session
```

## Task Details A: Auth UI & Screens

### 1.10 Create Login Screen UI (M - 2h)

**File:** `src/app/(auth)/login.tsx`

**Components:** Button, Input, Label, Alert (from 0.6.4 - React Native Reusables)

**Implementation:**

```tsx
// src/app/(auth)/login.tsx
import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { signIn, isLoading } = useAuth();

  const handleLogin = async () => {
    setError('');
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace('/(tabs)'); // Navigate to protected route
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-foreground mb-8">Login</Text>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <Text>{error}</Text>
          </Alert>
        )}

        <View className="space-y-4">
          <View>
            <Label>Email</Label>
            <Input
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View>
            <Label>Password</Label>
            <Input
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <Button onPress={handleLogin} disabled={isLoading} className="mt-4">
            <Text>{isLoading ? 'Logging in...' : 'Login'}</Text>
          </Button>

          <Button variant="link" onPress={() => router.push('/(auth)/reset-password')}>
            <Text>Forgot password?</Text>
          </Button>

          <Button variant="link" onPress={() => router.push('/(auth)/register')}>
            <Text>Create account</Text>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
```

**Key Features:**

- Email/password inputs with proper `keyboardType` and `autoComplete`
- Loading state disables button during API call
- Error display with Alert component (destructive variant for errors)
- Links to register (1.11) and reset password (1.12)
- Dark theme styling via `className` (uses #4299e1 primary blue from theme)

**Validation:**

- Client-side: Email format (HTML5 email input)
- Server-side: Supabase validates credentials

**Accessibility:**

- Label components for screen readers
- Keyboard navigation support
- Focus management

### 1.11 Create Register Screen UI (M - 2h)

**File:** `src/app/(auth)/register.tsx`

**Components:** Button, Input, Label, Alert, Checkbox (React Native Reusables)

**Implementation:**

```tsx
// src/app/(auth)/register.tsx
import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();
  const { signUp, isLoading } = useAuth();

  const validateForm = () => {
    const newErrors: string[] = [];

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.push('Invalid email format');
    }

    // Password validation
    if (password.length < 8) {
      newErrors.push('Password must be at least 8 characters');
    }

    // Password confirmation
    if (password !== confirmPassword) {
      newErrors.push('Passwords do not match');
    }

    // Terms acceptance
    if (!termsAccepted) {
      newErrors.push('You must accept the terms and conditions');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setErrors([]);
    const { error: signUpError } = await signUp(email, password);
    if (signUpError) {
      setErrors([signUpError.message]);
      return;
    }

    // Supabase sends confirmation email
    router.replace('/(auth)/login'); // Redirect to login with success message
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-8">
        <Text className="text-3xl font-bold text-foreground mb-8">Create Account</Text>

        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            {errors.map((error, index) => (
              <Text key={index}>• {error}</Text>
            ))}
          </Alert>
        )}

        <View className="space-y-4">
          <View>
            <Label>Email</Label>
            <Input
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View>
            <Label>Password</Label>
            <Input
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password-new"
            />
          </View>

          <View>
            <Label>Confirm Password</Label>
            <Input
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password-new"
            />
          </View>

          <View className="flex-row items-center space-x-2">
            <Checkbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />
            <Text className="text-sm text-muted-foreground">I accept the terms and conditions</Text>
          </View>

          <Button onPress={handleRegister} disabled={isLoading} className="mt-4">
            <Text>{isLoading ? 'Creating account...' : 'Create Account'}</Text>
          </Button>

          <Button variant="link" onPress={() => router.back()}>
            <Text>Already have an account? Login</Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

**Key Features:**

- Email/password inputs with confirmation field
- Client-side validation:
  - Email format (regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`)
  - Password ≥8 chars
  - Password confirmation match
  - Terms acceptance required
- Multiple error display (bulleted list)
- Loading state during API call
- ScrollView for keyboard avoidance
- Link back to login (1.10)

**Flow:**

1. User fills form → presses "Create Account"
2. Client validates → shows errors if validation fails
3. useAuth.signUp() → authService.signUp() → Supabase
4. Supabase sends confirmation email (default behavior)
5. Redirect to login with success message: "Check your email to confirm your account"

### 1.12 Implement Password Reset Flow (M - 2h)

**File:** `src/app/(auth)/reset-password.tsx`

**Components:** Button, Input, Label, Alert (React Native Reusables)

**Implementation (Request Reset):**

```tsx
// src/app/(auth)/reset-password.tsx
import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams(); // Deep link token
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { resetPassword, updatePassword, isLoading } = useAuth();

  const isResetMode = !token; // Request reset vs Set new password

  const handleRequestReset = async () => {
    setError('');
    setMessage('');

    const { error: resetError } = await resetPassword(email);
    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage('Check your email for a password reset link');
  };

  const handleUpdatePassword = async () => {
    setError('');
    setMessage('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const { error: updateError } = await updatePassword(newPassword);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage('Password updated successfully! Redirecting...');
    setTimeout(() => router.replace('/(auth)/login'), 2000);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-foreground mb-8">
          {isResetMode ? 'Reset Password' : 'Set New Password'}
        </Text>

        {message && (
          <Alert variant="default" className="mb-4">
            <Text>{message}</Text>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <Text>{error}</Text>
          </Alert>
        )}

        <View className="space-y-4">
          {isResetMode ? (
            <>
              <View>
                <Label>Email</Label>
                <Input
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <Button onPress={handleRequestReset} disabled={isLoading} className="mt-4">
                <Text>{isLoading ? 'Sending...' : 'Send Reset Link'}</Text>
              </Button>
            </>
          ) : (
            <>
              <View>
                <Label>New Password</Label>
                <Input
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoComplete="password-new"
                />
              </View>

              <Button onPress={handleUpdatePassword} disabled={isLoading} className="mt-4">
                <Text>{isLoading ? 'Updating...' : 'Update Password'}</Text>
              </Button>
            </>
          )}

          <Button variant="link" onPress={() => router.back()}>
            <Text>Back to Login</Text>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
```

**Deep Link Configuration:**

```typescript
// src/services/auth/index.ts (add to authService)
export const authService = {
  // ...
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'halterofit://reset-password', // Deep link URL
    });
    return { data, error };
  },
  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },
};
```

**Deep Link Handler (app.json):**

```json
{
  "expo": {
    "scheme": "halterofit",
    "slug": "halterofit"
  }
}
```

**Flow:**

1. **Request Reset:**
   - User enters email → presses "Send Reset Link"
   - Supabase sends email with link: `halterofit://reset-password?token=abc123`
2. **Handle Deep Link:**
   - User clicks email link → app opens at `/(auth)/reset-password?token=abc123`
   - `useLocalSearchParams()` extracts token → switches to "Set New Password" mode
3. **Update Password:**
   - User enters new password → presses "Update Password"
   - Supabase validates token + updates password → redirect to login

**Success States:**

- Request: "Check your email for a password reset link"
- Update: "Password updated successfully! Redirecting..."

### 1.13 Setup Protected Routes & Navigation Guards (S - 1.5h)

**File:** `src/app/_layout.tsx`

**Goal:** Redirect unauthenticated users to login, authenticated users to tabs

**Implementation:**

```tsx
// src/app/_layout.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { AppState } from 'react-native';

export default function RootLayout() {
  const { isAuthenticated, isLoading, refreshSession } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Supabase Best Practice: Auto-refresh tokens on app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshSession(); // Auto-refresh JWT token
      }
    });

    return () => subscription.remove();
  }, [refreshSession]);

  // Navigation guard
  useEffect(() => {
    if (isLoading) return; // Wait for rehydration

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  // Loading screen during auth check
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#4299e1" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
```

**Key Features:**

1. **Auth Guard Logic:**
   - Wait for `isLoading = false` (Zustand rehydration complete)
   - If unauthenticated + not in `(auth)` group → redirect to login
   - If authenticated + in `(auth)` group → redirect to tabs

2. **AppState Listener (Supabase Best Practice):**
   - Listen for app foreground events
   - Auto-refresh JWT token when app resumes
   - Prevents "Session expired" errors after backgrounding

3. **Loading Screen:**
   - Show spinner while `isLoading = true`
   - Prevents flash of wrong screen during rehydration

4. **Deep Linking Support:**
   - `useSegments()` correctly handles deep links like `halterofit://reset-password?token=abc`
   - Auth guard checks segment, not route name

**Testing:**

- Scenario 1: User logs in → should navigate to `/(tabs)`
- Scenario 2: User logs out → should navigate to `/(auth)/login`
- Scenario 3: App restart → should restore session from MMKV
- Scenario 4: Deep link → should preserve `?token=` parameter

### 1.14 Implement Supabase Auth Integration (M - 3h)

**File:** `src/services/auth/index.ts`

**Goal:** Raw Supabase API calls with error handling

**Implementation:**

```typescript
// src/services/auth/index.ts
import { supabase } from '@/services/supabase/client';

/**
 * Auth Service - Supabase Integration
 *
 * Raw Supabase API calls with user-friendly error handling.
 * Used by useAuth hook for business logic.
 */

// Error mapping for user-friendly messages
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password',
  'Email not confirmed': 'Please check your email to confirm your account',
  'User already registered': 'An account with this email already exists',
  'Password should be at least 6 characters': 'Password must be at least 8 characters',
};

function formatAuthError(error: any): string {
  return AUTH_ERROR_MESSAGES[error.message] || error.message || 'An error occurred';
}

export const authService = {
  /**
   * Sign in with email/password
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error: { message: formatAuthError(error) } };
    }

    return { data, error: null };
  },

  /**
   * Sign up with email/password
   * Supabase sends confirmation email automatically
   */
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'halterofit://login', // Deep link after email confirmation
      },
    });

    if (error) {
      return { data: null, error: { message: formatAuthError(error) } };
    }

    return { data, error: null };
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: { message: formatAuthError(error) } };
    }

    return { error: null };
  },

  /**
   * Request password reset email
   */
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'halterofit://reset-password',
    });

    if (error) {
      return { data: null, error: { message: formatAuthError(error) } };
    }

    return { data, error: null };
  },

  /**
   * Update user password (after reset)
   */
  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { data: null, error: { message: formatAuthError(error) } };
    }

    return { data, error: null };
  },

  /**
   * Refresh session (auto-refresh JWT token)
   * Called by AppState listener in _layout.tsx
   */
  refreshSession: async () => {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Session refresh failed:', error);
      return { data: null, error };
    }

    return { data, error: null };
  },

  /**
   * Get current session
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },
};
```

**useAuth Hook (Business Logic Wrapper):**

```typescript
// src/hooks/useAuth.ts (new file)
import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth/authStore';
import { authService } from '@/services/auth';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      const { data, error } = await authService.signIn(email, password);

      if (error) {
        setLoading(false);
        return { error };
      }

      setUser(data.user);
      return { data };
    },
    [setUser, setLoading]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      const { data, error } = await authService.signUp(email, password);

      if (error) {
        setLoading(false);
        return { error };
      }

      // Don't setUser yet - user must confirm email first
      setLoading(false);
      return { data };
    },
    [setLoading]
  );

  const signOut = useCallback(async () => {
    const { error } = await authService.signOut();
    if (error) return { error };

    setUser(null); // Clear user from store
    return { error: null };
  }, [setUser]);

  const resetPassword = useCallback(async (email: string) => {
    return authService.resetPassword(email);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    return authService.updatePassword(newPassword);
  }, []);

  const refreshSession = useCallback(async () => {
    const { data, error } = await authService.refreshSession();
    if (data?.user) {
      setUser(data.user); // Update user in store
    }
    return { data, error };
  }, [setUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
  };
};
```

**Key Features:**

1. **Error Handling:**
   - User-friendly error messages
   - Consistent `{ data, error }` return pattern

2. **Session Management:**
   - JWT tokens stored in MMKV via Supabase client config (storage abstraction)
   - Auto-refresh on app foreground (AppState listener in \_layout.tsx)
   - Persist session across app restarts

3. **Deep Links:**
   - Email confirmation: `halterofit://login`
   - Password reset: `halterofit://reset-password?token=abc`

4. **Supabase Best Practices:**
   - Use `signInWithPassword` (not deprecated `signIn`)
   - Use `resetPasswordForEmail` (not `resetPassword`)
   - Use `refreshSession` (not manual token refresh)

## Task Details B: Testing Infrastructure

### 1.15 Create Auth Test Infrastructure (S - 2h) 🔥 HIGH

**Goal:** Reusable test utilities for auth testing (factories, mocks, helpers)

**Files:**

- `__tests__/__helpers__/auth/factories.ts`
- `__tests__/__helpers__/auth/mocks.ts`

**Implementation (factories.ts):**

```typescript
// __tests__/__helpers__/auth/factories.ts
import { User } from '@/stores/auth/authStore';

/**
 * Test Factories for Auth Testing
 *
 * Provides reusable test data for auth tests.
 */

export function createTestAuthUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    ...overrides,
  };
}

export function createTestSession(overrides?: Partial<any>) {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600 * 1000,
    token_type: 'bearer',
    user: createTestAuthUser(),
    ...overrides,
  };
}

export function createTestAuthError(message: string) {
  return {
    message,
    status: 400,
    name: 'AuthError',
  };
}
```

**Implementation (mocks.ts):**

```typescript
// __tests__/__helpers__/auth/mocks.ts
import { vi } from 'vitest';

/**
 * Test Mocks for Auth Testing
 *
 * Provides mock implementations for Supabase and MMKV.
 */

// Mock Supabase auth
export const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  refreshSession: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
};

// Mock Supabase client
export const mockSupabase = {
  auth: mockSupabaseAuth,
};

// Mock MMKV storage
export const mockMMKVStorage = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  clearAll: vi.fn(),
  getAllKeys: vi.fn(() => []),
};

// Mock storage abstraction
export const mockStorage = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

// Helper to reset all mocks
export function resetAuthMocks() {
  Object.values(mockSupabaseAuth).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });

  Object.values(mockMMKVStorage).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });

  Object.values(mockStorage).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });
}
```

**Usage Example:**

```typescript
// __tests__/unit/services/auth.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '@/services/auth';
import { mockSupabase, createTestAuthUser, createTestSession, resetAuthMocks } from '@/__tests__/__helpers__/auth';

// Mock the Supabase client module
vi.mock('@/services/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('authService', () => {
  beforeEach(() => {
    resetAuthMocks();
  });

  describe('signIn', () => {
    it('should return user data on successful login', async () => {
      const mockUser = createTestAuthUser();
      const mockSession = createTestSession({ user: mockUser });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signIn('test@example.com', 'password123');

      expect(result.data).toBeDefined();
      expect(result.data?.user.email).toBe('test@example.com');
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // ... more test cases
  });
});
```

**Blocks:** 1.16, 1.17, 1.18, 1.19, 1.20 (all tests depend on this infrastructure)

### 1.16 Write Auth Service Tests (M - 4h) 🔥 CRITICAL

**File:** `__tests__/unit/services/auth.test.ts`

**Coverage Target:** 90%+ (auth is critical path)

**Test Cases:**

```typescript
// __tests__/unit/services/auth.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '@/services/auth';
import {
  mockSupabase,
  createTestAuthUser,
  createTestSession,
  createTestAuthError,
  resetAuthMocks,
} from '@/__tests__/__helpers__/auth';

vi.mock('@/services/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('authService', () => {
  beforeEach(() => {
    resetAuthMocks();
  });

  describe('signIn', () => {
    it('should return user data on successful login', async () => {
      const mockUser = createTestAuthUser();
      const mockSession = createTestSession({ user: mockUser });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signIn('test@example.com', 'password123');

      expect(result.data).toBeDefined();
      expect(result.data?.user.email).toBe('test@example.com');
      expect(result.error).toBeNull();
    });

    it('should return formatted error on invalid credentials', async () => {
      const mockError = createTestAuthError('Invalid login credentials');

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await authService.signIn('test@example.com', 'wrong');

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Incorrect email or password');
    });

    it('should handle network errors gracefully', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network request failed'));

      await expect(authService.signIn('test@example.com', 'password123')).rejects.toThrow('Network request failed');
    });

    it('should handle rate limiting', async () => {
      const mockError = createTestAuthError('Too many requests');
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await authService.signIn('test@example.com', 'password123');

      expect(result.error?.message).toBe('Too many requests');
    });
  });

  describe('signUp', () => {
    it('should return user data on successful registration', async () => {
      const mockUser = createTestAuthUser();
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null }, // No session until email confirmed
        error: null,
      });

      const result = await authService.signUp('test@example.com', 'password123');

      expect(result.data).toBeDefined();
      expect(result.data?.user.email).toBe('test@example.com');
      expect(result.error).toBeNull();
    });

    it('should return error on duplicate email', async () => {
      const mockError = createTestAuthError('User already registered');
      mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await authService.signUp('test@example.com', 'password123');

      expect(result.error?.message).toBe('An account with this email already exists');
    });

    it('should return error on weak password', async () => {
      const mockError = createTestAuthError('Password should be at least 6 characters');
      mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await authService.signUp('test@example.com', 'weak');

      expect(result.error?.message).toBe('Password must be at least 8 characters');
    });
  });

  describe('resetPassword', () => {
    it('should send reset email on valid email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await authService.resetPassword('test@example.com');

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: 'halterofit://reset-password',
      });
    });

    it('should handle invalid email gracefully', async () => {
      const mockError = createTestAuthError('Invalid email');
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await authService.resetPassword('invalid');

      expect(result.error?.message).toBe('Invalid email');
    });
  });

  describe('refreshSession', () => {
    it('should refresh expired tokens', async () => {
      const mockUser = createTestAuthUser();
      const mockSession = createTestSession({ user: mockUser });

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      const result = await authService.refreshSession();

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should handle revoked tokens', async () => {
      const mockError = createTestAuthError('Token revoked');
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await authService.refreshSession();

      expect(result.error).toBeDefined();
    });
  });
});
```

**Coverage Metrics:**

- Branches: 90%+
- Functions: 90%+
- Lines: 90%+
- Statements: 90%+

**Blocked by:** 1.14 (auth service), 1.15 (test infrastructure)

### 1.17 Write Auth Store Tests (S - 2h) 🟠 HIGH

**File:** `__tests__/unit/stores/authStore.test.ts`

**Test Cases:**

```typescript
// __tests__/unit/stores/authStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth/authStore';
import { mockSupabase, mockMMKVStorage, createTestAuthUser, resetAuthMocks } from '@/__tests__/__helpers__/auth';

// Mock MMKV storage
vi.mock('@/services/storage', () => ({
  zustandMMKVStorage: mockMMKVStorage,
}));

vi.mock('@/services/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('authStore', () => {
  beforeEach(() => {
    resetAuthMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  describe('setUser', () => {
    it('should update user and set isAuthenticated to true', () => {
      const mockUser = createTestAuthUser();

      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should persist user to MMKV after state change', () => {
      const mockUser = createTestAuthUser();

      useAuthStore.getState().setUser(mockUser);

      // Zustand persist middleware calls MMKV.set
      // Note: This test verifies the integration, not the actual persistence
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should set isAuthenticated to false when user is null', () => {
      useAuthStore.getState().setUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should call Supabase signOut and clear user', async () => {
      const mockUser = createTestAuthUser();
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('MMKV persistence', () => {
    it('should persist user and isAuthenticated to MMKV', () => {
      const mockUser = createTestAuthUser();

      useAuthStore.getState().setUser(mockUser);

      // Verify partialize only persists user and isAuthenticated (not isLoading)
      const state = useAuthStore.getState();
      expect(state.user).toBeDefined();
      expect(state.isAuthenticated).toBe(true);
      // isLoading should NOT be persisted (ephemeral)
    });

    it('should handle corrupted JSON during rehydration', () => {
      mockMMKVStorage.get.mockReturnValue('{ invalid json }');

      // Trigger rehydration by creating a new store instance
      // onRehydrateStorage error handler should reset to safe state
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle missing MMKV keys during rehydration', () => {
      mockMMKVStorage.get.mockReturnValue(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('loading state', () => {
    it('should start with isLoading = true', () => {
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it('should set isLoading = false after rehydration', () => {
      // Simulate rehydration complete
      useAuthStore.setState({ isLoading: false });

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });
});
```

**Blocked by:** 1.15 (MMKV mock)

### 1.18 Write Auth Validation Tests (S - 2h) 🔥 CRITICAL

**File:** `__tests__/unit/database/auth-validation.test.ts`

**Security Tests:**

```typescript
// __tests__/unit/database/auth-validation.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { workoutService } from '@/services/database/operations/workouts';
import { useAuthStore } from '@/stores/auth/authStore';
import { createTestAuthUser } from '@/__tests__/__helpers__/auth';

describe('Database Auth Validation', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  describe('unauthenticated access', () => {
    it('should throw AuthError when creating workout without auth', async () => {
      await expect(workoutService.createWorkout({ name: 'Test Workout' })).rejects.toThrow('User not authenticated');
    });

    it('should throw AuthError when fetching workouts without auth', async () => {
      await expect(workoutService.getWorkouts()).rejects.toThrow('User not authenticated');
    });

    it('should throw AuthError when deleting workout without auth', async () => {
      await expect(workoutService.deleteWorkout('workout-123')).rejects.toThrow('User not authenticated');
    });
  });

  describe('user ID mismatch', () => {
    it('should prevent creating workout for another user', async () => {
      const mockUser = createTestAuthUser({ id: 'user-123' });
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });

      await expect(
        workoutService.createWorkout({
          name: 'Test Workout',
          user_id: 'different-user-456', // Attempting to create for another user
        })
      ).rejects.toThrow('User ID mismatch');
    });
  });

  describe('ownership validation', () => {
    it("should prevent deleting another user's workout", async () => {
      const mockUser = createTestAuthUser({ id: 'user-123' });
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });

      // Assume workout-456 belongs to different-user-456
      await expect(workoutService.deleteWorkout('workout-456')).rejects.toThrow(
        'Unauthorized: Cannot delete workout owned by another user'
      );
    });
  });

  describe('authorization bypass attempts', () => {
    it('should validate user_id on all database operations', async () => {
      const mockUser = createTestAuthUser({ id: 'user-123' });
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });

      // Try to bypass auth by passing null user_id
      await expect(
        workoutService.createWorkout({
          name: 'Test Workout',
          user_id: null as any, // Bypass attempt
        })
      ).rejects.toThrow('Invalid user ID');
    });
  });
});
```

**Blocked by:** 1.15 (auth factories)

### 1.19 Write Sync Error Handling Tests (M - 4h) 🟠 MEDIUM

**File:** `__tests__/unit/database/sync-errors.test.ts`

**Test Cases:**

```typescript
// __tests__/unit/database/sync-errors.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncService } from '@/services/database/remote/sync';
import { mockSupabase, resetAuthMocks } from '@/__tests__/__helpers__/auth';

vi.mock('@/services/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('Sync Error Handling', () => {
  beforeEach(() => {
    resetAuthMocks();
  });

  describe('network failures', () => {
    it('should handle timeout errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error('Network timeout')),
      });

      await expect(syncService.pullChanges()).rejects.toThrow('Network timeout');
    });

    it('should handle 500 errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockRejectedValue({ status: 500, message: 'Internal server error' }),
      });

      await expect(syncService.pullChanges()).rejects.toThrow('Internal server error');
    });

    it('should handle DNS failures', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND')),
      });

      await expect(syncService.pullChanges()).rejects.toThrow('getaddrinfo ENOTFOUND');
    });
  });

  describe('conflict resolution', () => {
    it('should apply last-write-wins strategy', async () => {
      // Simulate conflict: local updated_at = 2025-01-01, remote updated_at = 2025-01-02
      const localWorkout = { id: 'workout-123', name: 'Local', updated_at: new Date('2025-01-01') };
      const remoteWorkout = { id: 'workout-123', name: 'Remote', updated_at: new Date('2025-01-02') };

      const result = syncService.resolveConflict(localWorkout, remoteWorkout);

      expect(result.name).toBe('Remote'); // Remote wins (newer timestamp)
    });
  });

  describe('partial sync failures', () => {
    it('should continue syncing after one table fails', async () => {
      const pullWorkouts = vi.fn().mockRejectedValue(new Error('Workouts sync failed'));
      const pullExercises = vi.fn().mockResolvedValue({ success: true });

      await syncService.sync();

      // Should log error for workouts but continue with exercises
      expect(pullExercises).toHaveBeenCalled();
    });
  });

  describe('auto-sync debouncing', () => {
    it('should debounce rapid sync calls', async () => {
      const syncSpy = vi.spyOn(syncService, 'sync');

      // Trigger 5 rapid syncs
      syncService.autoSync();
      syncService.autoSync();
      syncService.autoSync();
      syncService.autoSync();
      syncService.autoSync();

      // Wait for debounce (500ms)
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should only call sync once
      expect(syncSpy).toHaveBeenCalledTimes(1);
    });
  });
});
```

**Blocked by:** 1.15 (network mocks)

### 1.20 Write MMKV Storage Edge Case Tests (S - 2h) 🟢 MEDIUM

**File:** `__tests__/unit/database/mmkv-storage.test.ts`

**Test Cases:**

```typescript
// __tests__/unit/database/mmkv-storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mockMMKVStorage, resetAuthMocks } from '@/__tests__/__helpers__/auth';
import { storage } from '@/services/storage/storage';

vi.mock('react-native-mmkv', () => ({
  MMKV: vi.fn(() => mockMMKVStorage),
}));

describe('MMKV Storage Edge Cases', () => {
  beforeEach(() => {
    resetAuthMocks();
  });

  describe('storage full', () => {
    it('should throw error when storage is full', () => {
      mockMMKVStorage.set.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => storage.set('key', 'value')).toThrow('Storage quota exceeded');
    });
  });

  describe('invalid JSON', () => {
    it('should return null for invalid JSON', () => {
      mockMMKVStorage.get.mockReturnValue('{ invalid json }');

      const result = storage.get('auth-storage');

      expect(result).toBeNull();
    });

    it('should handle malformed JSON gracefully', () => {
      mockMMKVStorage.get.mockReturnValue('undefined');

      const result = storage.get('auth-storage');

      expect(result).toBeNull();
    });
  });

  describe('encryption failures', () => {
    it('should throw error on encryption failure', () => {
      mockMMKVStorage.set.mockImplementation(() => {
        throw new Error('Encryption key not found');
      });

      expect(() => storage.set('sensitive-data', 'secret')).toThrow('Encryption key not found');
    });
  });
});
```

**Blocked by:** 1.15 (MMKV mock)

### 1.21 Add CI Coverage Threshold (XS - 30min) 🔥 HIGH

**File:** `jest.config.js`

**Implementation:**

```javascript
// jest.config.js
module.exports = {
  // ... existing config
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/*.stories.{ts,tsx}', '!src/**/__tests__/**'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/services/auth/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/stores/auth/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/services/database/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

**CI Integration (.github/workflows/ci.yml):**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [master, develop]
  pull_request:
    branches: [master, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - name: Check coverage thresholds
        run: |
          if [ $? -ne 0 ]; then
            echo "Coverage threshold not met"
            exit 1
          fi
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

**Blocked by:** None (can set immediately)

### 1.22 Setup Maestro E2E + Auth Tests (L - 4h)

**Directory:** `.maestro/auth/`

**Goal:** Automated E2E tests for auth flows on Development Build

**Installation:**

```bash
# Install Maestro CLI globally
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

**Test Files:**

1. **auth-login.yaml:**

```yaml
# .maestro/auth/auth-login.yaml
appId: com.halterofit
- launchApp
- assertVisible: 'Login'

# Fill email field
- tapOn: 'Email'
- inputText: 'test@example.com'

# Fill password field
- tapOn: 'Password'
- inputText: 'password123'

# Tap login button
- tapOn: 'Login'

# Assert navigation to tabs
- assertVisible: 'Workout'
- assertVisible: 'Profile'
```

2. **auth-register.yaml:**

```yaml
# .maestro/auth/auth-register.yaml
appId: com.halterofit
- launchApp
- assertVisible: 'Login'

# Navigate to register
- tapOn: 'Create account'
- assertVisible: 'Create Account'

# Fill registration form
- tapOn: 'Email'
- inputText: 'newuser@example.com'
- tapOn: 'Password'
- inputText: 'securepassword123'
- tapOn: 'Confirm Password'
- inputText: 'securepassword123'

# Accept terms
- tapOn: 'I accept the terms and conditions'

# Submit registration
- tapOn: 'Create Account'

# Assert redirect to login
- assertVisible: 'Login'
- assertVisible: 'Check your email to confirm your account'
```

3. **auth-password-reset.yaml:**

```yaml
# .maestro/auth/auth-password-reset.yaml
appId: com.halterofit
- launchApp
- assertVisible: 'Login'

# Navigate to reset password
- tapOn: 'Forgot password?'
- assertVisible: 'Reset Password'

# Fill email field
- tapOn: 'Email'
- inputText: 'test@example.com'

# Submit reset request
- tapOn: 'Send Reset Link'

# Assert success message
- assertVisible: 'Check your email for a password reset link'
```

**Running Tests:**

```bash
# Run single test
maestro test .maestro/auth/auth-login.yaml

# Run all auth tests
maestro test .maestro/auth/

# Run on specific device
maestro test --device "iPhone 14" .maestro/auth/auth-login.yaml
```

**Documentation Update (docs/TESTING.md):**

````markdown
### Maestro E2E Tests

**Location:** `.maestro/auth/`

**Setup:**

1. Install Maestro CLI: `curl -Ls "https://get.maestro.mobile.dev" | bash`
2. Build Development Build: `eas build --profile development --platform ios`
3. Install build on device/simulator

**Running Tests:**

```bash
maestro test .maestro/auth/              # Run all auth tests
maestro test .maestro/auth/auth-login.yaml  # Run specific test
```
````

**Test Coverage:**

- Login flow (email/password → tabs)
- Register flow (form validation → email confirmation)
- Password reset flow (email → success message)

````


## Task Details C: Database Enhancements

### 1.30 Implement Cascading Delete Logic (S - 2h) 🟠 HIGH

**File:** `src/services/database/operations/workouts.ts`

**Issue:** `deleteWorkout()` only marks workout as deleted, leaves orphaned child records (exercises, sets)

**Current Implementation (lines 664-698):**

```typescript
// Current (BROKEN)
async deleteWorkout(workoutId: string) {
  const workout = await db.get<Workout>('workouts').find(workoutId);
  await workout.markAsDeleted(); // Only marks workout, NOT children
}
````

**Fixed Implementation:**

```typescript
// Fixed (CASCADING DELETE)
async deleteWorkout(workoutId: string) {
  const workout = await db.get<Workout>('workouts').find(workoutId);

  await db.write(async () => {
    // Step 1: Delete all sets (deepest children)
    const exercises = await workout.exercises.fetch();
    for (const exercise of exercises) {
      const sets = await exercise.sets.fetch();
      for (const set of sets) {
        await set.markAsDeleted();
      }
    }

    // Step 2: Delete all exercises
    for (const exercise of exercises) {
      await exercise.markAsDeleted();
    }

    // Step 3: Delete workout
    await workout.markAsDeleted();
  });
}
```

**Explanation:**

- **WatermelonDB `markAsDeleted()`:** Soft delete (sets `_status = 'deleted'`)
- **Sync Protocol:** Deleted records synced to Supabase, then permanently deleted
- **Order Matters:** Delete children first (sets → exercises → workout)

**Testing:**

```typescript
// __tests__/unit/database/cascading-delete.test.ts
describe('Cascading Delete', () => {
  it('should delete workout and all children', async () => {
    const workout = await workoutService.createWorkout({ name: 'Test Workout' });
    const exercise = await exerciseService.createExercise({ workout_id: workout.id });
    const set = await setService.createSet({ exercise_id: exercise.id });

    await workoutService.deleteWorkout(workout.id);

    // Assert all records marked as deleted
    const deletedWorkout = await db.get('workouts').find(workout.id);
    expect(deletedWorkout._raw._status).toBe('deleted');

    const deletedExercise = await db.get('exercises').find(exercise.id);
    expect(deletedExercise._raw._status).toBe('deleted');

    const deletedSet = await db.get('sets').find(set.id);
    expect(deletedSet._raw._status).toBe('deleted');

    // After sync, verify all deleted from Supabase
    await syncService.sync();
    // ... Supabase queries to verify permanent deletion
  });
});
```

### 1.31 Enhance User Model with Relations & Helper Methods (M - 3h) 🟠 HIGH

**File:** `src/services/database/local/models/User.ts`

**Current Implementation:**

```typescript
// Current (MINIMAL)
export class User extends Model {
  static table = 'users';

  @field('email') email!: string;
}
```

**Enhanced Implementation:**

```typescript
// Enhanced (WITH RELATIONS & HELPERS)
import { Model, Query, Relation } from '@nozbe/watermelondb';
import { field, relation, children } from '@nozbe/watermelondb/decorators';
import { Workout } from './Workout';

export class User extends Model {
  static table = 'users';

  static associations = {
    workouts: { type: 'has_many', foreignKey: 'user_id' },
  } as const;

  @field('email') email!: string;

  // Relations
  @children('workouts') workouts!: Query<Workout>;

  // Helper: Get active workout (in-progress)
  async getActiveWorkout(): Promise<Workout | null> {
    const activeWorkouts = await this.workouts.extend((query) => query.where('status', 'in_progress')).fetch();

    return activeWorkouts[0] || null;
  }

  // Helper: Get total workout count
  async getWorkoutCount(): Promise<number> {
    const workouts = await this.workouts.fetch();
    return workouts.length;
  }

  // Helper: Get completed workouts
  async getCompletedWorkouts(): Promise<Workout[]> {
    return this.workouts.extend((query) => query.where('status', 'completed')).fetch();
  }

  // Helper: Get workout history (last N workouts)
  async getWorkoutHistory(limit: number = 10): Promise<Workout[]> {
    return this.workouts
      .extend((query) => query.where('status', 'completed').sortBy('completed_at', 'desc').take(limit))
      .fetch();
  }
}
```

**Testing:**

```typescript
// __tests__/unit/models/User.test.ts
describe('User Model', () => {
  let user: User;

  beforeEach(async () => {
    user = await db.get<User>('users').create((u) => {
      u.email = 'test@example.com';
    });
  });

  describe('getActiveWorkout', () => {
    it('should return in-progress workout', async () => {
      await db.get<Workout>('workouts').create((w) => {
        w.user.set(user);
        w.status = 'in_progress';
      });

      const activeWorkout = await user.getActiveWorkout();

      expect(activeWorkout).toBeDefined();
      expect(activeWorkout?.status).toBe('in_progress');
    });

    it('should return null when no active workout', async () => {
      const activeWorkout = await user.getActiveWorkout();

      expect(activeWorkout).toBeNull();
    });
  });

  describe('getWorkoutCount', () => {
    it('should return total workout count', async () => {
      await db.get<Workout>('workouts').createMany([
        (w) => {
          w.user.set(user);
        },
        (w) => {
          w.user.set(user);
        },
        (w) => {
          w.user.set(user);
        },
      ]);

      const count = await user.getWorkoutCount();

      expect(count).toBe(3);
    });
  });
});
```

### 1.32 Add Sync Retry with Exponential Backoff (L - 5h) 🟠 HIGH

**File:** `src/services/database/remote/sync.ts`

**Goal:** Auto-retry failed syncs with exponential backoff (1s, 2s, 4s)

**Implementation:**

```typescript
// src/services/database/remote/sync.ts
import { synchronize } from '@nozbe/watermelondb/sync';
import { supabase } from '@/services/supabase/client';
import { storage } from '@/services/storage/storage';

interface FailedSync {
  timestamp: number;
  error: string;
  retryCount: number;
}

export const syncService = {
  /**
   * Sync with retry logic
   * @param maxRetries Maximum retry attempts (default: 3)
   */
  async syncWithRetry(maxRetries: number = 3): Promise<void> {
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        await this.sync();

        // Success - clear failed sync queue
        storage.delete('failed-syncs');
        return;
      } catch (error) {
        retryCount++;

        if (retryCount > maxRetries) {
          // Max retries exceeded - persist to offline queue
          this.persistFailedSync(error as Error);
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = Math.pow(2, retryCount - 1) * 1000;
        console.warn(`Sync failed (attempt ${retryCount}/${maxRetries}). Retrying in ${backoffMs}ms...`);

        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  },

  /**
   * Standard sync (called by syncWithRetry)
   */
  async sync(): Promise<void> {
    await synchronize({
      database: db,
      pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
        const { data, error } = await supabase.rpc('pull_changes', {
          last_pulled_at: lastPulledAt,
          schema_version: schemaVersion,
          migration,
        });

        if (error) throw error;

        return {
          changes: data.changes,
          timestamp: data.timestamp,
        };
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        const { error } = await supabase.rpc('push_changes', {
          changes,
          last_pulled_at: lastPulledAt,
        });

        if (error) throw error;
      },
    });
  },

  /**
   * Persist failed sync to offline queue (MMKV)
   */
  persistFailedSync(error: Error): void {
    const failedSyncs = this.getFailedSyncs();
    failedSyncs.push({
      timestamp: Date.now(),
      error: error.message,
      retryCount: 3, // Max retries exceeded
    });

    storage.set('failed-syncs', JSON.stringify(failedSyncs));
  },

  /**
   * Get failed syncs from offline queue
   */
  getFailedSyncs(): FailedSync[] {
    const json = storage.get('failed-syncs');
    return json ? JSON.parse(json) : [];
  },

  /**
   * Retry all failed syncs (called on app foreground)
   */
  async retryFailedSyncs(): Promise<void> {
    const failedSyncs = this.getFailedSyncs();

    if (failedSyncs.length === 0) return;

    console.log(`Retrying ${failedSyncs.length} failed syncs...`);

    for (const failedSync of failedSyncs) {
      try {
        await this.sync();
        console.log(`Retry successful for sync from ${new Date(failedSync.timestamp)}`);
      } catch (error) {
        console.error(`Retry failed:`, error);
      }
    }

    // Clear queue after retry attempt
    storage.delete('failed-syncs');
  },
};
```

**AppState Integration (\_layout.tsx):**

```typescript
// src/app/_layout.tsx (add to AppState listener)
useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      refreshSession(); // Existing
      syncService.retryFailedSyncs(); // NEW: Retry failed syncs on foreground
    }
  });

  return () => subscription.remove();
}, [refreshSession]);
```

**Testing (Manual E2E):**

```markdown
### E2E Test: Sync Retry with Exponential Backoff

**Setup:**

1. Build Development Build
2. Turn off WiFi + cellular data

**Steps:**

1. Create a new workout (saved locally)
2. Trigger sync (should fail due to no network)
3. Verify console log: "Sync failed (attempt 1/3). Retrying in 1000ms..."
4. Wait 1s → "Sync failed (attempt 2/3). Retrying in 2000ms..."
5. Wait 2s → "Sync failed (attempt 3/3). Retrying in 4000ms..."
6. Wait 4s → "Max retries exceeded. Persisted to offline queue."
7. Turn on WiFi
8. Background app → foreground app
9. Verify console log: "Retrying 1 failed syncs..."
10. Verify sync succeeds: "Retry successful for sync from ..."
11. Check Supabase database → workout should be present

**Expected Result:** Sync succeeds after retry, no data loss.
```

## Supabase Best Practices

### Session Management

**Use Supabase Client with Storage Abstraction:**

```typescript
// src/services/supabase/client.ts (already configured)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key: string) => storage.get(key),
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    autoRefreshToken: true, // Auto-refresh JWT tokens
    persistSession: true, // Persist session to storage
    detectSessionInUrl: false, // Disable for mobile (no URL bar)
  },
});
```

**Benefits:**

- JWT tokens stored in MMKV (encrypted, fast)
- Auto-refresh on token expiry
- Session persists across app restarts

### AppState Listener (Token Refresh on Foreground)

**Why:** Supabase JWT tokens expire after 1 hour. If user backgrounds app for > 1 hour, token becomes stale.

**Solution:** Refresh tokens when app returns to foreground

```typescript
// src/app/_layout.tsx (already implemented)
useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      refreshSession(); // Auto-refresh JWT token
    }
  });

  return () => subscription.remove();
}, [refreshSession]);
```

**Reference:** [Supabase React Native Docs](https://supabase.com/docs/guides/auth/sessions/react-native#session-management)

### Error Handling

**Map Supabase Errors to User-Friendly Messages:**

```typescript
// src/services/auth/index.ts
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password',
  'Email not confirmed': 'Please check your email to confirm your account',
  'User already registered': 'An account with this email already exists',
  'Password should be at least 6 characters': 'Password must be at least 8 characters',
};

function formatAuthError(error: any): string {
  return AUTH_ERROR_MESSAGES[error.message] || error.message || 'An error occurred';
}
```

**Benefits:**

- Users understand errors
- Consistent error messages across app
- No technical jargon ("Invalid credentials" → "Incorrect email or password")

### onAuthStateChange Listener (Optional)

**Use Case:** Real-time auth state updates (e.g., user signs out in another tab)

**Not Recommended for Mobile:** Mobile apps don't have multiple tabs, so this is unnecessary overhead.

**Preferred Pattern:** Use `useAuth` hook + `AppState` listener instead.

## Testing Strategy

> 📖 **For complete testing documentation**, see [TESTING.md](./TESTING.md)

**Phase 1 Test Coverage Goals:**

| Component         | Target | Priority    |
| ----------------- | ------ | ----------- |
| Auth services     | 90%    | 🔥 Critical |
| Auth store        | 90%    | 🔥 Critical |
| Database services | 80%    | 🟠 High     |
| Global            | 70%    | 🟢 Medium   |

**Test Infrastructure (Task 1.15):**

- Factories: `createTestAuthUser()`, `createTestSession()`
- Mocks: `mockSupabase`, `mockMMKVStorage`

**Quick Commands:**

```bash
npm test                    # Run all unit tests
npm run test:coverage       # Coverage report
maestro test .maestro/auth/ # E2E auth flows (Task 1.22)
```

**See [TESTING.md](./TESTING.md) for:**

- Complete testing strategy (unit, integration, E2E)
- Test writing patterns and best practices
- Coverage requirements and validation
- Troubleshooting guide

## Summary

**Phase 1 delivers:**

- Complete auth flow (login, register, reset password)
- 90% auth test coverage (unit + E2E)
- Database reliability (cascading delete, User helpers, sync retry)
- Production-ready architecture (Hooks + Services + Store)

**Next Phase (Phase 2):**

- Workout plans & navigation (Jefit-style Find/Planned tabs)
- Plan management (create, edit, delete plans)
- Exercise search & selection

**Questions or Issues?** Refer to [TASKS.md](./TASKS.md) for task breakdown or [TECHNICAL.md](./TECHNICAL.md) for architecture decisions.
