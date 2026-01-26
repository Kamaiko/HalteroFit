/**
 * String utility functions
 */

/**
 * Capitalize first letter of each word
 * @example capitalizeWords('hello world') // 'Hello World'
 */
export function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
