import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInventory, getInventoryItem, getLowStockItems, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../../api/inventory';
import type { CreateInventoryItemRequest, UpdateInventoryItemRequest } from '../../types';

export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (page: number, pageSize: number, search?: string) => [...inventoryKeys.lists(), page, pageSize, search] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...inventoryKeys.details(), id] as const,
  lowStock: (threshold?: number) => [...inventoryKeys.all, 'low-stock', threshold] as const,
};

export function useInventoryList(page: number, pageSize: number, search?: string) {
  return useQuery({
    queryKey: inventoryKeys.list(page, pageSize, search),
    queryFn: () => getInventory(page, pageSize, search),
  });
}

export function useInventoryItem(id: number) {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => getInventoryItem(id),
    enabled: id > 0,
  });
}

export function useAllInventoryItems(totalHint = 100) {
  return useQuery({
    queryKey: [...inventoryKeys.all, 'all-items'] as const,
    queryFn: async () => {
      const first = await getInventory(1, totalHint);
      if (first.totalCount <= first.items.length) return first.items;
      const full = await getInventory(1, first.totalCount);
      return full.items;
    },
  });
}

export function useLowStockItems(threshold?: number) {
  return useQuery({
    queryKey: inventoryKeys.lowStock(threshold),
    queryFn: () => getLowStockItems(threshold),
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: CreateInventoryItemRequest) => createInventoryItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, item }: { id: number; item: UpdateInventoryItemRequest }) => updateInventoryItem(id, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteInventoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
