import { useEffect, useRef, useState, useCallback } from "react";

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
 * Returns `{ value, ref }`. Attach `ref` to the DOM element displaying the
 * value — the hook will write to `textContent` directly during animation,
 * bypassing React state to avoid re-render cascades (e.g. with Recharts).
 * React state is synced once when the animation completes.
 */
export function useAnimatedCounter({
  target: rawTarget,
  duration = 1200,
  formatter = (n) => String(Math.round(n)),
  enabled = true,
}: UseAnimatedCounterOptions): { value: string; ref: React.RefCallback<HTMLElement> } {
  const target = Number.isFinite(rawTarget) ? rawTarget : 0;
  const [displayValue, setDisplayValue] = useState<string>(formatter(target));
  const formatterRef = useRef(formatter);
  formatterRef.current = formatter;
  const elementRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const ref = useCallback((el: HTMLElement | null) => {
    elementRef.current = el;
  }, []);

  useEffect(() => {
    const fmt = formatterRef.current;
    if (!enabled) {
      const val = fmt(target);
      setDisplayValue(val);
      if (elementRef.current) elementRef.current.textContent = val;
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
      const formatted = formatterRef.current(currentValue);

      // Write directly to DOM — no React re-render
      if (elementRef.current) {
        elementRef.current.textContent = formatted;
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Sync React state once at the end
        setDisplayValue(formatted);
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

  return { value: displayValue, ref };
}
