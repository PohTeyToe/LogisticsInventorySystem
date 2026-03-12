import client from './client';
import type { Warehouse, WarehouseUtilization } from '../types';

export async function getWarehouses() {
  const { data } = await client.get<Warehouse[]>('/api/warehouse');
  return data;
}

export async function createWarehouse(warehouse: { name: string; address?: string; capacity: number }) {
  const { data } = await client.post<Warehouse>('/api/warehouse', warehouse);
  return data;
}

export async function updateWarehouse(id: number, warehouse: { name?: string; address?: string; capacity?: number; isActive?: boolean }) {
  const { data } = await client.put<Warehouse>(`/api/warehouse/${id}`, warehouse);
  return data;
}

export async function deleteWarehouse(id: number) {
  await client.delete(`/api/warehouse/${id}`);
}

export async function getWarehouseUtilization(id: number) {
  const { data } = await client.get<WarehouseUtilization>(`/api/warehouse/${id}/utilization`);
  return data;
}
