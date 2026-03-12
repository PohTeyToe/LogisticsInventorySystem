// Data computation helpers for analytics components

import type { InventoryItem, StockMovement, ValuationReport } from '../../types';
import { CHART_COLORS } from './chartUtils';

// ---------- ABC Analysis ----------
export interface AbcItem {
  name: string;
  sku: string;
  value: number;
  cumulativePct: number;
  abcClass: 'A' | 'B' | 'C';
}

export function computeAbcAnalysis(items: InventoryItem[]): AbcItem[] {
  const valued = items
    .map((it) => ({ name: it.name, sku: it.sku, value: it.quantity * it.unitPrice }))
    .sort((a, b) => b.value - a.value);

  const totalValue = valued.reduce((s, v) => s + v.value, 0);
  if (totalValue === 0) return [];

  let cumulative = 0;
  return valued.map((it, idx) => {
    cumulative += it.value;
    const cumulativePct = (cumulative / totalValue) * 100;
    const abcClass = idx === 0 ? 'A' : cumulativePct <= 80 ? 'A' : cumulativePct <= 95 ? 'B' : 'C';
    return { ...it, cumulativePct, abcClass };
  });
}

// ---------- Movement trends ----------
export interface MovementTrend {
  date: string;
  inQty: number;
  outQty: number;
}

export function computeMovementTrends(movements: StockMovement[]): MovementTrend[] {
  const byDate = new Map<string, { inQty: number; outQty: number }>();
  for (const m of movements) {
    const date = new Date(m.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const entry = byDate.get(date) || { inQty: 0, outQty: 0 };
    if (m.type === 'IN') entry.inQty += m.quantity;
    else if (m.type === 'OUT') entry.outQty += m.quantity;
    byDate.set(date, entry);
  }
  return Array.from(byDate.entries())
    .map(([date, vals]) => ({ date, ...vals }))
    .reverse();
}

// ---------- Top movers ----------
export interface TopMover {
  sku: string;
  name: string;
  inCount: number;
  outCount: number;
  netChange: number;
}

export function computeTopMovers(movements: StockMovement[]): TopMover[] {
  const map = new Map<string, TopMover>();
  for (const m of movements) {
    const existing = map.get(m.itemSku) || { sku: m.itemSku, name: m.itemName, inCount: 0, outCount: 0, netChange: 0 };
    if (m.type === 'IN') {
      existing.inCount += m.quantity;
      existing.netChange += m.quantity;
    } else if (m.type === 'OUT') {
      existing.outCount += m.quantity;
      existing.netChange -= m.quantity;
    }
    map.set(m.itemSku, existing);
  }
  return Array.from(map.values())
    .sort((a, b) => (b.inCount + b.outCount) - (a.inCount + a.outCount))
    .slice(0, 10);
}

// ---------- Treemap data ----------
export interface TreemapNode {
  name: string;
  size: number;
  fill: string;
  [key: string]: unknown;
}

export function computeCategoryTreemap(report: ValuationReport): TreemapNode[] {
  return (report.categoryBreakdown || [])
    .filter((c) => c.totalValue > 0)
    .map((c, i) => ({
      name: c.categoryName,
      size: c.totalValue,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
}
