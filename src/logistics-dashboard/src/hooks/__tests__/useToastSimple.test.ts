import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from '../useToastSimple'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with no toasts', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toasts).toEqual([])
  })

  it('adds a toast with default variant', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('Hello')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Hello')
    expect(result.current.toasts[0].variant).toBe('info')
  })

  it('adds a toast with specified variant', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('Success!', 'success')
    })

    expect(result.current.toasts[0].variant).toBe('success')
  })

  it('adds multiple toasts', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('First')
      result.current.addToast('Second', 'warning')
    })

    expect(result.current.toasts).toHaveLength(2)
    expect(result.current.toasts[0].message).toBe('First')
    expect(result.current.toasts[1].message).toBe('Second')
  })

  it('assigns unique ids to toasts', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('One')
      result.current.addToast('Two')
    })

    expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id)
  })

  it('dismisses a toast by marking it as exiting then removing', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('Dismiss me')
    })

    const toastId = result.current.toasts[0].id

    act(() => {
      result.current.dismiss(toastId)
    })

    // Should be marked exiting
    expect(result.current.toasts[0].exiting).toBe(true)

    // After 300ms animation delay, should be removed
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('auto-dismisses after duration', () => {
    const { result } = renderHook(() => useToast(2000))

    act(() => {
      result.current.addToast('Auto dismiss')
    })

    expect(result.current.toasts).toHaveLength(1)

    // After the duration, the toast should start exiting
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // The toast is marked as exiting
    expect(result.current.toasts[0]?.exiting).toBe(true)

    // After the exit animation delay (300ms), removed
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.toasts).toHaveLength(0)
  })
})
