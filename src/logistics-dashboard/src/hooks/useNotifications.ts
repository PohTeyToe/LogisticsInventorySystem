import { useState, useMemo, useCallback } from 'react';
import type { LowStockAlert, PurchaseOrder, StockMovement } from '../types';
import type { Notification } from '../components/shared/NotificationCenter';

interface UseNotificationsOptions {
  lowStock: LowStockAlert[];
  orders: PurchaseOrder[];
  movements: StockMovement[];
}

function buildNotifications(
  lowStock: LowStockAlert[],
  orders: PurchaseOrder[],
  movements: StockMovement[],
): Notification[] {
  const notifications: Notification[] = [];

  for (const alert of lowStock) {
    notifications.push({
      id: `low-stock-${alert.itemId}`,
      type: 'warning',
      title: `Low stock: ${alert.name}`,
      message: `${alert.currentQuantity}/${alert.reorderLevel} units remaining at ${alert.warehouseName}`,
      timestamp: new Date().toISOString(),
      read: false,
    });
  }

  for (const order of orders) {
    const type = order.status === 'Cancelled' ? 'danger' as const
      : order.status === 'Received' ? 'success' as const
      : 'info' as const;

    notifications.push({
      id: `po-${order.id}`,
      type,
      title: `PO-${order.id} ${order.status}`,
      message: `${order.supplierName} — $${order.totalAmount.toLocaleString()}`,
      timestamp: order.orderDate,
      read: false,
    });
  }

  for (const movement of movements) {
    const type = movement.type === 'IN' ? 'success' as const : 'info' as const;
    const label = movement.type === 'IN' ? 'Stock In'
      : movement.type === 'OUT' ? 'Stock Out'
      : 'Adjustment';

    notifications.push({
      id: `mov-${movement.id}`,
      type,
      title: `${label}: ${movement.itemName}`,
      message: `${movement.quantity} units — ${movement.reason || movement.itemSku}`,
      timestamp: movement.timestamp,
      read: false,
    });
  }

  notifications.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return notifications.slice(0, 20);
}

export function useNotifications({ lowStock, orders, movements }: UseNotificationsOptions) {
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

  const allNotifications = useMemo(
    () => buildNotifications(lowStock, orders, movements),
    [lowStock, orders, movements],
  );

  const notifications = useMemo(
    () =>
      allNotifications
        .filter((n) => !dismissedIds.has(n.id))
        .map((n) => ({ ...n, read: readIds.has(n.id) })),
    [allNotifications, readIds, dismissedIds],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const n of allNotifications) next.add(n.id);
      return next;
    });
  }, [allNotifications]);

  const dismissNotification = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  return { notifications, unreadCount, markRead, markAllRead, dismissNotification };
}
