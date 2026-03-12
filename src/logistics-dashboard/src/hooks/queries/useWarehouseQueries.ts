import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../../api/warehouses';

export const warehouseKeys = {
  all: ['warehouses'] as const,
  list: () => [...warehouseKeys.all, 'list'] as const,
};

export function useWarehousesList() {
  return useQuery({
    queryKey: warehouseKeys.list(),
    queryFn: getWarehouses,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (warehouse: { name: string; address?: string; capacity: number }) => createWarehouse(warehouse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, warehouse }: { id: number; warehouse: { name?: string; address?: string; capacity?: number; isActive?: boolean } }) => updateWarehouse(id, warehouse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
    },
  });
}
