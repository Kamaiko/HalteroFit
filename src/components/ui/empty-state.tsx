/**
 * Empty State
 *
 * Centered placeholder for screens/sections with no content.
 * Displays an icon, title, optional subtitle, and optional action button.
 *
 * Usage:
 *   <EmptyState
 *     icon="calendar-outline"
 *     title="No workout days yet"
 *     subtitle="Add your first workout day to get started"
 *     action={{ label: "+ Add a day", onPress: handleAdd }}
 *   />
 */

import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Colors, ICON_SIZE_2XL } from '@/constants';

// ============================================================================
// Types
// ============================================================================

export interface EmptyStateProps {
  /** Ionicons icon name */
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Primary message */
  title: string;
  /** Secondary explanation (optional) */
  subtitle?: string;
  /** Call-to-action button (optional) */
  action?: { label: string; onPress: () => void };
  /** Additional className for the container */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function EmptyState({ icon, title, subtitle, action, className }: EmptyStateProps) {
  return (
    <View className={`flex-1 items-center justify-center p-8 ${className ?? ''}`}>
      <Ionicons name={icon} size={ICON_SIZE_2XL} color={Colors.foreground.tertiary} />
      <Text className="mt-4 text-center text-lg font-semibold text-foreground">{title}</Text>
      {subtitle && (
        <Text className="mt-2 text-center text-sm text-foreground-secondary">{subtitle}</Text>
      )}
      {action && (
        <Button className="mt-6" onPress={action.onPress}>
          <Text className="font-medium text-white">{action.label}</Text>
        </Button>
      )}
    </View>
  );
}
