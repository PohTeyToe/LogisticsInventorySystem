// Shared chart utilities for analytics components

import { formatCurrency, formatCurrencyCounter } from '../../hooks/useSettings';

// Chart palette — values match CSS variables --chart-color-1 through --chart-color-8 in theme.css
export const CHART_COLORS = ['#00D4AA', '#58A6FF', '#F59E0B', '#3FB950', '#F85149', '#A371F7', '#D2A8FF', '#8B949E'];

// ABC class colors — A=teal (--chart-color-1), B=blue (--chart-color-2), C=muted (--text-muted)
export const ABC_COLORS: Record<string, string> = { A: '#00D4AA', B: '#58A6FF', C: '#484F58' };

export const getVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const fmtCurrency = (n: number) => formatCurrency(n, 0);

export const fmtCurrencyCounter = (n: number) => formatCurrencyCounter(n);
