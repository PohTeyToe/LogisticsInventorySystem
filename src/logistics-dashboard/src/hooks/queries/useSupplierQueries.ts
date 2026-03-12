import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../api/suppliers';

export const supplierKeys = {
  all: ['suppliers'] as const,
  list: () => [...supplierKeys.all, 'list'] as const,
};

export function useSuppliersList() {
  return useQuery({
    queryKey: supplierKeys.list(),
    queryFn: getSuppliers,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (supplier: { name: string; contactEmail?: string; phone?: string; address?: string }) => createSupplier(supplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, supplier }: { id: number; supplier: { name?: string; contactEmail?: string; phone?: string; address?: string } }) => updateSupplier(id, supplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
    },
  });
}
