import client from './client';
import type { PaginatedResponse, InventoryItem, CreateInventoryItemRequest, UpdateInventoryItemRequest } from '../types';

export async function getInventory(page = 1, pageSize = 20, search?: string) {
  const params: Record<string, string | number> = { page, pageSize };
  if (search) params.search = search;
  const { data } = await client.get<PaginatedResponse<InventoryItem>>('/api/inventory', { params });
  return data;
}

export async function getInventoryItem(id: number) {
  const { data } = await client.get<InventoryItem>(`/api/inventory/${id}`);
  return data;
}

export async function createInventoryItem(item: CreateInventoryItemRequest) {
  const { data } = await client.post<InventoryItem>('/api/inventory', item);
  return data;
}

export async function updateInventoryItem(id: number, item: UpdateInventoryItemRequest) {
  const { data } = await client.put<InventoryItem>(`/api/inventory/${id}`, item);
  return data;
}

export async function deleteInventoryItem(id: number) {
  await client.delete(`/api/inventory/${id}`);
}

export async function getLowStockItems(threshold?: number) {
  const params = threshold ? { threshold } : {};
  const { data } = await client.get<InventoryItem[]>('/api/inventory/low-stock', { params });
  return data;
}
