import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStockMovements, createStockMovement, getItemMovementHistory } from '../../api/stockMovements';
import type { StockMovementType } from '../../types';
import { inventoryKeys } from './useInventoryQueries';

export const stockMovementKeys = {
  all: ['stockMovements'] as const,
  lists: () => [...stockMovementKeys.all, 'list'] as const,
  list: (params?: { itemId?: number; type?: StockMovementType; limit?: number }) => [...stockMovementKeys.lists(), params] as const,
  itemHistory: (itemId: number) => [...stockMovementKeys.all, 'history', itemId] as const,
};

export function useStockMovementsList(params?: { itemId?: number; type?: StockMovementType; limit?: number }) {
  return useQuery({
    queryKey: stockMovementKeys.list(params),
    queryFn: () => getStockMovements(params),
  });
}

export function useItemMovementHistory(itemId: number) {
  return useQuery({
    queryKey: stockMovementKeys.itemHistory(itemId),
    queryFn: () => getItemMovementHistory(itemId),
    enabled: itemId > 0,
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (movement: { inventoryItemId: number; type: StockMovementType; quantity: number; reason?: string }) => createStockMovement(movement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockMovementKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
