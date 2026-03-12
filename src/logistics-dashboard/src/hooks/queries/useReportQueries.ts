import { useQuery } from '@tanstack/react-query';
import { getValuationReport, getLowStockReport, getTotalValue } from '../../api/reports';

export const reportKeys = {
  all: ['reports'] as const,
  valuation: () => [...reportKeys.all, 'valuation'] as const,
  lowStock: (threshold?: number) => [...reportKeys.all, 'low-stock', threshold] as const,
  totalValue: () => [...reportKeys.all, 'total-value'] as const,
};

export function useValuationReport() {
  return useQuery({
    queryKey: reportKeys.valuation(),
    queryFn: getValuationReport,
  });
}

export function useLowStockReport(threshold?: number) {
  return useQuery({
    queryKey: reportKeys.lowStock(threshold),
    queryFn: () => getLowStockReport(threshold),
  });
}

export function useTotalValue() {
  return useQuery({
    queryKey: reportKeys.totalValue(),
    queryFn: getTotalValue,
  });
}
