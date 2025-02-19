/** We use multiplication to shift decimal places to the right so we can work with them as whole numbers */
const precisionMultipliers = [1, 10, 100, 1000, 10000, 100000, 1000000] as const;

/**
 * Ultra-optimized number rounding function that preserves a given precision non-integer values (2 by default)
 * But will chop off any decimals that end up being 0's, soas to return a user friendly display number
 * Uses truncate instead of string operations for maximum performance.
 *
 * @param {number} num - The number to round
 * @returns {number} The rounded result
 *
 * roundOptimized(23.456)      -> 23.46
 * roundOptimized(23.99999)    -> 24
 * roundOptimized(-23.456)     -> -23.46
 * roundOptimized(-23.99999)   -> -24
 * roundOptimized(23.004)      -> 23
 * roundOptimized(23.006)      -> 23.01
 *
 * Performance: MUCH faster than using toFixed() or similar string-based methods
 * Range: Safe for larger numbers, does not use bitwise operations
 */
export function roundOptimized(num: number, precision: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 2): number {
  // Shift decimal point to the right by multiplying
  // This lets us work with the decimals we care about as whole numbers
  const multiplier = precisionMultipliers[precision]!;
  const shifted = num * multiplier;

  // Add or subtract 0.5 before truncating based on sign
  // This ensures correct rounding direction for both positive and negative numbers
  // Trunc is faster than floor
  const rounded = Math.trunc(shifted + (shifted > 0 ? 0.5 : -0.5));

  // Prefer division here instead of multiplication or you may get weird float precision results like "-2122.2200000000003"
  const result = rounded / multiplier;

  // Normalize any zero result to avoid -0 returns
  return result === 0 ? 0 : result;
}
