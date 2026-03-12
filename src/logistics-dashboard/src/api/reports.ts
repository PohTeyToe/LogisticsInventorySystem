import client from './client';
import type { ValuationReport, LowStockAlert } from '../types';

export async function getValuationReport() {
  const { data } = await client.get<ValuationReport>('/api/report/valuation');
  return data;
}

export async function getLowStockReport(threshold?: number) {
  const params = threshold ? { threshold } : {};
  const { data } = await client.get<LowStockAlert[]>('/api/report/low-stock', { params });
  return data;
}

export async function getTotalValue() {
  const { data } = await client.get<{ totalValue: number }>('/api/report/total-value');
  return data;
}
