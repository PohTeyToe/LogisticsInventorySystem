import { useEffect, useRef, useState } from "react";

interface UseAnimatedCounterOptions {
  target: number;
  duration?: number;
  formatter?: (n: number) => string;
  enabled?: boolean;
}

/**
 * Animates a numeric counter from 0 to `target` using requestAnimationFrame
 * with easeOutExpo easing. Re-animates whenever `target` changes.
 *
 * @returns The current counter value as a formatted string.
 */
export function useAnimatedCounter({
  target: rawTarget,
  duration = 1200,
  formatter = (n) => String(Math.round(n)),
  enabled = true,
}: UseAnimatedCounterOptions): string {
  const target = Number.isFinite(rawTarget) ? rawTarget : 0;
  const [displayValue, setDisplayValue] = useState<string>(formatter(target));
  const formatterRef = useRef(formatter);
  formatterRef.current = formatter;
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    if (!enabled) {
      setDisplayValue(formatterRef.current(target));
      return;
    }

    let cancelled = false;
    const startTime = performance.now();
    const startTarget = target;

    const easeOutExpo = (t: number): number =>
      t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const animate = (currentTime: number) => {
      if (cancelled) return;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentValue = easeOutExpo(progress) * startTarget;

      setDisplayValue(formatterRef.current(currentValue));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration, enabled]);

  return displayValue;
}
