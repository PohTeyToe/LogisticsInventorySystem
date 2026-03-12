/** Read user preferences from localStorage (set by Settings page). */

type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
  CAD: 'CA$',
};

export function getPageSize(fallback = 20): number {
  const val = localStorage.getItem('logistics-page-size');
  const n = Number(val);
  return n > 0 ? n : fallback;
}

export function getCurrency(): Currency {
  const val = localStorage.getItem('logistics-currency') as Currency | null;
  return val && CURRENCY_SYMBOLS[val] ? val : 'USD';
}

export function formatCurrency(n: number, decimals = 0): string {
  const currency = getCurrency();
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);
  } catch {
    // Fallback if Intl fails
    return `${CURRENCY_SYMBOLS[currency]}${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
}

/** Short format for counter animations (no decimals). */
export function formatCurrencyCounter(n: number): string {
  return formatCurrency(Math.round(n), 0);
}
