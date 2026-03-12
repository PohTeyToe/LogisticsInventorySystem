import { describe, it, expect, vi, afterEach } from 'vitest'
import { timeAgo } from '../timeAgo'

describe('timeAgo', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Just now" for timestamps less than 60 seconds ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T12:00:30Z'))
    expect(timeAgo('2026-03-12T12:00:00Z')).toBe('Just now')
  })

  it('returns minutes ago for timestamps < 60 minutes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T12:15:00Z'))
    expect(timeAgo('2026-03-12T12:00:00Z')).toBe('15m ago')
  })

  it('returns hours ago for timestamps < 24 hours', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T15:00:00Z'))
    expect(timeAgo('2026-03-12T12:00:00Z')).toBe('3h ago')
  })

  it('returns "Yesterday" for timestamps between 24 and 48 hours ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-13T12:00:00Z'))
    expect(timeAgo('2026-03-12T12:00:00Z')).toBe('Yesterday')
  })

  it('returns a short date for timestamps older than 48 hours', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))
    const result = timeAgo('2026-03-12T12:00:00Z')
    expect(result).toContain('Mar')
    expect(result).toContain('12')
  })
})
