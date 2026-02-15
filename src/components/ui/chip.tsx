/**
 * Chip
 *
 * Small pill-shaped label for tags, categories, and filter values.
 *
 * Usage:
 *   <Chip label="Barbell" />
 *   <Chip label="Active" variant="secondary" />
 */

import { View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';
import { BORDER_RADIUS_PILL } from '@/constants';

// ============================================================================
// Variants
// ============================================================================

const chipVariants = cva('px-3 py-1', {
  variants: {
    variant: {
      primary: 'bg-primary/15',
      secondary: 'bg-background-elevated',
      outline: 'border border-border',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

const chipTextVariants = cva('text-sm', {
  variants: {
    variant: {
      primary: 'text-primary',
      secondary: 'text-foreground-secondary',
      outline: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

// ============================================================================
// Types
// ============================================================================

export interface ChipProps extends VariantProps<typeof chipVariants> {
  label: string;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function Chip({ label, variant, className }: ChipProps) {
  return (
    <View
      className={cn(chipVariants({ variant }), className)}
      style={{ borderRadius: BORDER_RADIUS_PILL }}
    >
      <Text className={chipTextVariants({ variant })}>{label}</Text>
    </View>
  );
}
