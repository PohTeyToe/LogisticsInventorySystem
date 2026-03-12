import { useEffect, useState, useCallback } from 'react';
import { ArrowRight, Download } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import StatusBadge from '../components/shared/StatusBadge';
import SkeletonTable from '../components/shared/SkeletonTable';
import ToastContainer from '../components/shared/ToastContainer';
import { getPurchaseOrders, updatePurchaseOrderStatus } from '../api/purchaseOrders';
import { exportToCsv } from '../utils/exportCsv';
import { useToast } from '../hooks/useToastSimple';
import type { PurchaseOrder, PurchaseOrderStatus } from '../types';
import styles from './CrudPage.module.css';
import dashStyles from './Dashboard.module.css';

const statusFlow: Record<string, PurchaseOrderStatus | null> = {
  Pending: 'Approved',
  Approved: 'Shipped',
  Shipped: 'Received',
  Received: null,
  Cancelled: null,
};

const allStatuses: (PurchaseOrderStatus | 'All')[] = ['All', 'Pending', 'Approved', 'Shipped', 'Received', 'Cancelled'];

export default function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [filter, setFilter] = useState<PurchaseOrderStatus | 'All'>('All');
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, dismiss } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await getPurchaseOrders(filter === 'All' ? undefined : filter));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const advanceStatus = async (id: number, currentStatus: PurchaseOrderStatus) => {
    const next = statusFlow[currentStatus];
    if (!next) return;
    try {
      await updatePurchaseOrderStatus(id, next);
      addToast(`Order advanced to ${next}`, 'success');
      load();
    } catch (err) {
      console.error(err);
      addToast('Failed to advance order status', 'danger');
    }
  };

  const handleExport = () => {
    const headers = ['PO #', 'Supplier', 'Status', 'Total Amount', 'Order Date'];
    const rows = orders.map((o) => [
      `PO-${String(o.id).padStart(4, '0')}`, o.supplierName, o.status,
      o.totalAmount, new Date(o.orderDate).toLocaleDateString(),
    ]);
    exportToCsv('purchase-orders.csv', headers, rows);
  };

  const pipelineCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const fmtCurrency = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <>
      <Header title="Purchase Orders" />
      <main className={styles.content}>
        {filter === 'All' && (
          <div className={dashStyles.pipeline} style={{ marginBottom: 16 }}>
            {(['Pending', 'Approved', 'Shipped', 'Received'] as PurchaseOrderStatus[]).map((status) => (
              <div key={status} className={`${dashStyles.pipelineStage} ${dashStyles[`stage${status}`]}`} onClick={() => setFilter(status)} style={{ cursor: 'pointer' }}>
                <div className={dashStyles.pipelineCount}>{pipelineCounts[status] || 0}</div>
                <div className={dashStyles.pipelineLabel}>{status}</div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.toolbar}>
          <div className={styles.filterRow} style={{ margin: 0 }}>
            {allStatuses.map((s) => (
              <button key={s} className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`} onClick={() => setFilter(s)}>
                {s}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download size={14} /> Export
          </Button>
        </div>

        <Card title="Purchase Orders" count={orders.length} noPadding>
          <table className={styles.table}>
            <thead>
              <tr><th>PO #</th><th>Supplier</th><th>Date</th><th>Status</th><th>Total</th><th></th></tr>
            </thead>
            {loading ? (
              <SkeletonTable rows={5} cols={6} />
            ) : (
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={6} className={styles.empty}>No purchase orders found</td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className={`${styles.mono} ${styles.primary}`}>PO-{String(o.id).padStart(4, '0')}</td>
                  <td>{o.supplierName}</td>
                  <td className={styles.mono}>{new Date(o.orderDate).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge variant={o.status.toLowerCase() as 'pending' | 'approved' | 'shipped' | 'received' | 'cancelled'}>
                      {o.status}
                    </StatusBadge>
                  </td>
                  <td className={styles.mono}>{fmtCurrency(o.totalAmount)}</td>
                  <td>
                    {statusFlow[o.status] && (
                      <Button size="sm" onClick={() => advanceStatus(o.id, o.status)}>
                        {statusFlow[o.status]} <ArrowRight size={12} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            )}
          </table>
        </Card>
        <ToastContainer toasts={toasts} dismiss={dismiss} />
      </main>
    </>
  );
}
