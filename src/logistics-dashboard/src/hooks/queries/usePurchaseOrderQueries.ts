import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder } from '../../api/purchaseOrders';
import type { PurchaseOrderStatus } from '../../types';

export const purchaseOrderKeys = {
  all: ['purchaseOrders'] as const,
  lists: () => [...purchaseOrderKeys.all, 'list'] as const,
  list: (status?: PurchaseOrderStatus) => [...purchaseOrderKeys.lists(), status] as const,
  details: () => [...purchaseOrderKeys.all, 'detail'] as const,
  detail: (id: number) => [...purchaseOrderKeys.details(), id] as const,
};

export function usePurchaseOrdersList(status?: PurchaseOrderStatus) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(status),
    queryFn: () => getPurchaseOrders(status),
  });
}

export function usePurchaseOrder(id: number) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: () => getPurchaseOrder(id),
    enabled: id > 0,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: { supplierId: number; expectedDeliveryDate?: string; items: { itemName: string; quantity: number; unitPrice: number }[] }) => createPurchaseOrder(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: PurchaseOrderStatus }) => updatePurchaseOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
    },
  });
}
