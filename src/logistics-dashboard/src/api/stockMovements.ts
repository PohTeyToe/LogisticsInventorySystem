import client from './client';
import type { StockMovement, StockMovementType } from '../types';

export async function getStockMovements(params?: { itemId?: number; type?: StockMovementType; limit?: number }) {
  const { data } = await client.get<StockMovement[]>('/api/stockmovement', { params });
  return data;
}

export async function createStockMovement(movement: { inventoryItemId: number; type: StockMovementType; quantity: number; reason?: string }) {
  const { data } = await client.post<StockMovement>('/api/stockmovement', movement);
  return data;
}

export async function getItemMovementHistory(itemId: number) {
  const { data } = await client.get<StockMovement[]>(`/api/stockmovement/item/${itemId}/history`);
  return data;
}
