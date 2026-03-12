import client from './client';
import type { Supplier } from '../types';

export async function getSuppliers() {
  const { data } = await client.get<Supplier[]>('/api/supplier');
  return data;
}

export async function createSupplier(supplier: { name: string; contactEmail?: string; phone?: string; address?: string }) {
  const { data } = await client.post<Supplier>('/api/supplier', supplier);
  return data;
}

export async function updateSupplier(id: number, supplier: { name?: string; contactEmail?: string; phone?: string; address?: string }) {
  const { data } = await client.put<Supplier>(`/api/supplier/${id}`, supplier);
  return data;
}

export async function deleteSupplier(id: number) {
  await client.delete(`/api/supplier/${id}`);
}
