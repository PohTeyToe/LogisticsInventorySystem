import client from './client';
import type { PurchaseOrder, PurchaseOrderStatus } from '../types';

export async function getPurchaseOrders(status?: PurchaseOrderStatus) {
  const params = status ? { status } : {};
  const { data } = await client.get<PurchaseOrder[]>('/api/purchaseorder', { params });
  return data;
}

export async function getPurchaseOrder(id: number) {
  const { data } = await client.get<PurchaseOrder>(`/api/purchaseorder/${id}`);
  return data;
}

export async function createPurchaseOrder(order: { supplierId: number; expectedDeliveryDate?: string; items: { itemName: string; quantity: number; unitPrice: number }[] }) {
  const { data } = await client.post<PurchaseOrder>('/api/purchaseorder', order);
  return data;
}

export async function updatePurchaseOrderStatus(id: number, status: PurchaseOrderStatus) {
  const { data } = await client.put<PurchaseOrder>(`/api/purchaseorder/${id}/status`, { status });
  return data;
}

export async function deletePurchaseOrder(id: number) {
  await client.delete(`/api/purchaseorder/${id}`);
}
