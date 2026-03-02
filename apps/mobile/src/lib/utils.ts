import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines and merges Tailwind CSS classes intelligently
 *
 * This utility function combines clsx for conditional class composition
 * and tailwind-merge for resolving conflicting Tailwind classes.
 *
 * @example
 * ```tsx
 * // Basic usage
 * cn('px-4 py-2', 'bg-primary')
 * // => 'px-4 py-2 bg-primary'
 *
 * // Conditional classes
 * cn('px-4', isActive && 'bg-primary')
 * // => 'px-4 bg-primary' (if isActive is true)
 *
 * // Conflict resolution (last class wins)
 * cn('px-4', 'px-6')
 * // => 'px-6' (tailwind-merge resolves conflicts)
 * ```
 *
 * @param inputs - Class values to combine (strings, objects, arrays, booleans, null, undefined)
 * @returns Merged class string with conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
