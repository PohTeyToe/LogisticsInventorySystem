import { describe, it, expect } from 'vitest'
import { toCamelCase, convertKeysToCamelCase } from '../caseConverter'

describe('toCamelCase', () => {
  it('converts PascalCase to camelCase', () => {
    expect(toCamelCase('ItemName')).toBe('itemName')
    expect(toCamelCase('OrderDate')).toBe('orderDate')
  })

  it('converts fully uppercase acronyms to lowercase', () => {
    expect(toCamelCase('SKU')).toBe('sku')
    expect(toCamelCase('ID')).toBe('id')
  })

  it('converts trailing acronyms correctly', () => {
    expect(toCamelCase('ItemSKU')).toBe('itemSku')
    expect(toCamelCase('OrderID')).toBe('orderId')
  })

  it('leaves already-camelCase strings unchanged', () => {
    expect(toCamelCase('name')).toBe('name')
    expect(toCamelCase('itemName')).toBe('itemName')
  })
})

describe('convertKeysToCamelCase', () => {
  it('converts top-level object keys', () => {
    const input = { ItemName: 'Widget', SKU: 'ABC', ID: 1 }
    expect(convertKeysToCamelCase(input)).toEqual({
      itemName: 'Widget',
      sku: 'ABC',
      id: 1,
    })
  })

  it('converts nested object keys', () => {
    const input = {
      OrderInfo: {
        OrderID: 42,
        ItemSKU: 'X1',
      },
    }
    expect(convertKeysToCamelCase(input)).toEqual({
      orderInfo: {
        orderId: 42,
        itemSku: 'X1',
      },
    })
  })

  it('converts keys inside arrays', () => {
    const input = [
      { ItemName: 'A', SKU: '1' },
      { ItemName: 'B', SKU: '2' },
    ]
    expect(convertKeysToCamelCase(input)).toEqual([
      { itemName: 'A', sku: '1' },
      { itemName: 'B', sku: '2' },
    ])
  })

  it('returns primitives as-is', () => {
    expect(convertKeysToCamelCase('hello')).toBe('hello')
    expect(convertKeysToCamelCase(42)).toBe(42)
    expect(convertKeysToCamelCase(null)).toBe(null)
  })
})
