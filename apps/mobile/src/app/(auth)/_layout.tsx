/**
 * Auth Layout (Public Routes)
 *
 * Contains unauthenticated screens (sign-in, sign-up, etc.).
 * Redirects authenticated users back to the app root.
 */

import { Redirect, Slot } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return <Slot />;
}
