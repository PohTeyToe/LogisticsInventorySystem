import { useState, useEffect } from 'react';
import StatusBadge from '../shared/StatusBadge';
import { getPurchaseOrder } from '../../api/purchaseOrders';
import type { PurchaseOrder } from '../../types';
import styles from './PurchaseOrderDetail.module.css';

interface PurchaseOrderDetailProps {
  orderId: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PurchaseOrderDetail({ orderId }: PurchaseOrderDetailProps) {
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPurchaseOrder(orderId)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return <div className={styles.loadingState}>Loading order details...</div>;
  }

  if (!order) {
    return <div className={styles.emptyState}>Unable to load order details.</div>;
  }

  const statusVariant = order.status.toLowerCase() as 'pending' | 'approved' | 'shipped' | 'received' | 'cancelled';

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.headerArea}>
        <h3 className={styles.poNumber}>PO-{String(order.id).padStart(4, '0')}</h3>
        <div className={styles.badges}>
          <span className={styles.supplierBadge}>{order.supplierName}</span>
          <StatusBadge variant={statusVariant}>{order.status}</StatusBadge>
        </div>
      </div>

      {/* Quick Stats */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Summary</h4>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Value</span>
            <span className={`${styles.statValue} ${styles.teal}`}>
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Line Items</span>
            <span className={styles.statValue}>{order.items?.length ?? 0}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Qty</span>
            <span className={styles.statValue}>
              {(order.items ?? []).reduce((s, li) => s + li.quantity, 0).toLocaleString()}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Status</span>
            <span className={styles.statValue}>{order.status}</span>
          </div>
        </div>
      </section>

      {/* Order Details */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Details</h4>
        <dl className={styles.detailList}>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>Supplier</dt>
            <dd className={styles.detailValue}>{order.supplierName}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>Order Date</dt>
            <dd className={styles.detailValue}>{formatDate(order.orderDate)}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>Status</dt>
            <dd className={styles.detailValue}>{order.status}</dd>
          </div>
        </dl>
      </section>

      {/* Line Items */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Line Items</h4>
        {(!order.items || order.items.length === 0) ? (
          <p className={styles.emptyState}>No line items on this order.</p>
        ) : (
          <table className={styles.lineTable}>
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((li) => (
                <tr key={li.id}>
                  <td>{li.itemName}</td>
                  <td className={styles.mono}>{li.itemSKU}</td>
                  <td className={styles.mono}>{li.quantity}</td>
                  <td className={styles.mono}>{formatCurrency(li.unitPrice)}</td>
                  <td className={styles.mono}>{formatCurrency(li.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>Total</td>
                <td className={styles.mono}>{formatCurrency(order.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>
    </div>
  );
}
