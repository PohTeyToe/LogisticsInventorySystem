import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportToCsv } from '../exportCsv'

describe('exportToCsv', () => {
  let clickSpy: ReturnType<typeof vi.fn>
  let mockLink: Record<string, unknown>
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clickSpy = vi.fn()
    mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: clickSpy,
    }

    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return mockLink as unknown as HTMLAnchorElement
      }
      return originalCreateElement(tag)
    })

    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)

    createObjectURLSpy = vi.fn().mockReturnValue('blob:test-url')
    revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('creates a blob and triggers download', () => {
    exportToCsv('test.csv', ['Name', 'Value'], [['Item1', 100]])

    expect(createObjectURLSpy).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURLSpy).toHaveBeenCalledOnce()
  })

  it('appends .csv extension if missing', () => {
    exportToCsv('report', ['A'], [['B']])
    expect(mockLink.download).toBe('report.csv')
  })

  it('keeps .csv extension if already present', () => {
    exportToCsv('data.csv', ['A'], [['B']])
    expect(mockLink.download).toBe('data.csv')
  })

  it('escapes fields with commas', () => {
    expect(() => {
      exportToCsv('test.csv', ['Name'], [['Hello, World']])
    }).not.toThrow()
  })

  it('handles empty rows', () => {
    expect(() => {
      exportToCsv('empty.csv', ['Col1', 'Col2'], [])
    }).not.toThrow()
  })
})
