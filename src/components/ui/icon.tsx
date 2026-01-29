import { ComponentProps } from 'react';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Icon size and color variants using CVA
 *
 * This provides type-safe variants for icon sizing and theming.
 * All sizes and colors use Tailwind classes for consistency.
 */
const iconVariants = cva('', {
  variants: {
    size: {
      sm: 'text-base', // 16px
      md: 'text-xl', // 20px
      lg: 'text-2xl', // 24px
      xl: 'text-3xl', // 28px
    },
    variant: {
      default: 'text-foreground',
      primary: 'text-primary',
      secondary: 'text-foreground-secondary',
      muted: 'text-foreground-tertiary',
      success: 'text-success',
      destructive: 'text-destructive',
      warning: 'text-warning',
      info: 'text-info',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

/**
 * Supported icon packs from @expo/vector-icons
 *
 * - material: Material Design icons (1,000+ icons, modern style)
 * - ionicons: Ionic icons (700+ icons, iOS/Android native style)
 * - fontawesome: Font Awesome icons (1,500+ icons, includes fitness-specific icons)
 */
export type IconPack = 'material' | 'ionicons' | 'fontawesome';

/**
 * Icon component props
 */
export interface IconProps extends VariantProps<typeof iconVariants> {
  /** Icon name from the selected pack */
  name: string;
  /** Icon pack to use (default: 'material') */
  pack?: IconPack;
  /** Additional Tailwind classes */
  className?: string;
}

/**
 * Unified Icon component wrapper for @expo/vector-icons
 *
 * This component provides a consistent API for using icons across the app,
 * with built-in theming support and size variants.
 *
 * @example
 * ```tsx
 * // Default icon (Material, medium, default color)
 * <Icon name="home" />
 *
 * // Large primary icon
 * <Icon name="settings" size="lg" variant="primary" />
 *
 * // Ionicons with custom styling
 * <Icon name="person" pack="ionicons" variant="muted" className="mr-2" />
 *
 * // FontAwesome fitness icon
 * <Icon name="dumbbell" pack="fontawesome" size="xl" variant="success" />
 * ```
 *
 * @see https://icons.expo.fyi/ - Icon explorer for all available icons
 */
export function Icon({ name, pack = 'material', size, variant, className }: IconProps) {
  const IconComponent = {
    material: MaterialIcons,
    ionicons: Ionicons,
    fontawesome: FontAwesome,
  }[pack];

  return (
    <IconComponent
      name={name as any} // Type assertion needed due to @expo/vector-icons typing
      className={cn(iconVariants({ size, variant }), className)}
    />
  );
}

/**
 * Re-export icon packs for direct use when wrapper is not needed
 *
 * @example
 * ```tsx
 * import { MaterialIcons } from '@/components/ui/icon';
 * <MaterialIcons name="home" size={24} color="#00E5FF" />
 * ```
 */
export { MaterialIcons, Ionicons, FontAwesome };
