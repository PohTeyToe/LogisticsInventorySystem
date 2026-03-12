import { useMemo } from "react";

interface UseSparklineDataOptions {
  currentValue: number;
  seed: string;
  volatility?: number;
}

/**
 * Deterministic pseudo-random number generator seeded by a string.
 * Uses a simple hash-based approach (similar to xorshift) for reproducibility.
 */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }

  return () => {
    hash ^= hash << 13;
    hash ^= hash >> 17;
    hash ^= hash << 5;
    // Normalize to [0, 1)
    return (Math.abs(hash) % 10000) / 10000;
  };
}

/**
 * Generates a deterministic 7-point sparkline array where the last value
 * always equals `currentValue`. Points vary by up to `volatility` (fraction)
 * of the current value, seeded by the `seed` string for consistency.
 *
 * @returns number[] of length 7
 */
export function useSparklineData({
  currentValue,
  seed,
  volatility = 0.15,
}: UseSparklineDataOptions): number[] {
  return useMemo(() => {
    const rng = seededRandom(seed);
    const points: number[] = [];

    for (let i = 0; i < 6; i++) {
      const variation = (rng() * 2 - 1) * volatility;
      const value = currentValue * (1 + variation);
      points.push(Math.max(0, Math.round(value * 100) / 100));
    }

    // Last point is always the current value
    points.push(currentValue);

    return points;
  }, [currentValue, seed, volatility]);
}
