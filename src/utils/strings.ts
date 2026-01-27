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

/**
 * Remove redundant "Step:X" prefix from exercise instructions
 * @example stripStepPrefix('Step:1 Lie flat on your back') // 'Lie flat on your back'
 * @example stripStepPrefix('Hold the bar with both hands') // 'Hold the bar with both hands'
 */
export function stripStepPrefix(instruction: string): string {
  return instruction.replace(/^Step:\d+\s*/i, '');
}
