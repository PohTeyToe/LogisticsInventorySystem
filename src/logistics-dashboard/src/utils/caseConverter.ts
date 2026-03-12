/**
 * Converts a PascalCase or UPPER_CASE key to camelCase.
 * Handles all-caps acronyms: SKU -> sku, ItemSKU -> itemSku, ID -> id
 */
export function toCamelCase(key: string): string {
  // Handle fully uppercase keys: SKU -> sku, ID -> id
  if (/^[A-Z][A-Z0-9]*$/.test(key)) {
    return key.toLowerCase();
  }

  // Handle keys with trailing acronyms: ItemSKU -> itemSku, OrderID -> orderId
  // Replace sequences of uppercase letters followed by end-of-string or another uppercase+lowercase
  let result = key.replace(/([A-Z]+)([A-Z][a-z])/g, (_match, upper: string, rest: string) => {
    return upper.slice(0, -1).toLowerCase() + upper.slice(-1) + rest;
  });

  // Handle trailing acronyms: ItemSKU -> itemSku (the trailing all-caps part)
  result = result.replace(/([a-z0-9])([A-Z]{2,})$/g, (_match, before: string, upper: string) => {
    return before + upper[0] + upper.slice(1).toLowerCase();
  });

  // Lowercase the first character
  result = result.charAt(0).toLowerCase() + result.slice(1);

  return result;
}

/**
 * Recursively converts all object keys from PascalCase to camelCase.
 */
export function convertKeysToCamelCase(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(convertKeysToCamelCase);
  }
  if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      converted[toCamelCase(key)] = convertKeysToCamelCase(value);
    }
    return converted;
  }
  return data;
}
