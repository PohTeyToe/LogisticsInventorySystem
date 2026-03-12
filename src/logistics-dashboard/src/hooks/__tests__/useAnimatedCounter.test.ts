import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAnimatedCounter } from '../useAnimatedCounter'

describe('useAnimatedCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Mock requestAnimationFrame to call callback synchronously with a time
    let frameId = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frameId++
      // Simulate calling after enough time for animation to complete
      setTimeout(() => cb(performance.now() + 2000), 0)
      return frameId
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('returns a string value', () => {
    const { result } = renderHook(() =>
      useAnimatedCounter({ target: 100, enabled: false }),
    )
    expect(typeof result.current.value).toBe('string')
  })

  it('returns a ref callback', () => {
    const { result } = renderHook(() =>
      useAnimatedCounter({ target: 100, enabled: false }),
    )
    expect(typeof result.current.ref).toBe('function')
  })

  it('handles zero target', () => {
    const { result } = renderHook(() =>
      useAnimatedCounter({ target: 0, enabled: false }),
    )
    expect(result.current.value).toBe('0')
  })

  it('handles negative target', () => {
    const { result } = renderHook(() =>
      useAnimatedCounter({ target: -5, enabled: false }),
    )
    expect(result.current.value).toBe('-5')
  })

  it('handles NaN target by defaulting to 0', () => {
    const { result } = renderHook(() =>
      useAnimatedCounter({ target: NaN, enabled: false }),
    )
    expect(result.current.value).toBe('0')
  })

  it('handles Infinity target by defaulting to 0', () => {
    const { result } = renderHook(() =>
      useAnimatedCounter({ target: Infinity, enabled: false }),
    )
    expect(result.current.value).toBe('0')
  })

  it('uses custom formatter when provided', () => {
    const formatter = (n: number) => `$${Math.round(n)}`
    const { result } = renderHook(() =>
      useAnimatedCounter({ target: 42, formatter, enabled: false }),
    )
    expect(result.current.value).toBe('$42')
  })

  it('sets value immediately when disabled', () => {
    const { result } = renderHook(() =>
      useAnimatedCounter({ target: 500, enabled: false }),
    )
    expect(result.current.value).toBe('500')
  })

  it('updates value when target changes and enabled is false', () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedCounter({ target, enabled: false }),
      { initialProps: { target: 10 } },
    )
    expect(result.current.value).toBe('10')

    rerender({ target: 20 })
    expect(result.current.value).toBe('20')
  })
})
