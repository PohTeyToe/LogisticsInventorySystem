import { useQuery } from '@tanstack/react-query';
import { getValuationReport, getLowStockReport } from '../../api/reports';
import { getStockMovements } from '../../api/stockMovements';
import { getWarehouses } from '../../api/warehouses';
import { getPurchaseOrders } from '../../api/purchaseOrders';
import { getInventory } from '../../api/inventory';
import { getCategories } from '../../api/categories';
import { getPageSize } from '../useSettings';
import { reportKeys } from './useReportQueries';
import { stockMovementKeys } from './useStockMovementQueries';
import { warehouseKeys } from './useWarehouseQueries';
import { purchaseOrderKeys } from './usePurchaseOrderQueries';
import { inventoryKeys } from './useInventoryQueries';
import { categoryKeys } from './useCategoryQueries';

function getPollInterval(): number {
  const stored = localStorage.getItem('logistics-refresh-interval');
  if (!stored || stored === 'off') return 0;
  const seconds = Number(stored);
  return seconds > 0 ? seconds * 1000 : 30_000;
}

export function useDashboardValuation() {
  const interval = getPollInterval();
  return useQuery({
    queryKey: reportKeys.valuation(),
    queryFn: getValuationReport,
    refetchInterval: interval || false,
  });
}

export function useDashboardLowStock() {
  const interval = getPollInterval();
  return useQuery({
    queryKey: reportKeys.lowStock(),
    queryFn: () => getLowStockReport(),
    refetchInterval: interval || false,
  });
}

export function useDashboardMovements() {
  const interval = getPollInterval();
  return useQuery({
    queryKey: stockMovementKeys.list({ limit: 6 }),
    queryFn: () => getStockMovements({ limit: 6 }),
    refetchInterval: interval || false,
  });
}

export function useDashboardWarehouses() {
  const interval = getPollInterval();
  return useQuery({
    queryKey: warehouseKeys.list(),
    queryFn: getWarehouses,
    refetchInterval: interval || false,
  });
}

export function useDashboardOrders() {
  const interval = getPollInterval();
  return useQuery({
    queryKey: purchaseOrderKeys.list(),
    queryFn: () => getPurchaseOrders(),
    refetchInterval: interval || false,
  });
}

export function useDashboardInventory() {
  const interval = getPollInterval();
  return useQuery({
    queryKey: inventoryKeys.list(1, getPageSize(100)),
    queryFn: () => getInventory(1, getPageSize(100)),
    refetchInterval: interval || false,
  });
}

export function useDashboardCategories() {
  const interval = getPollInterval();
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: getCategories,
    refetchInterval: interval || false,
  });
}
