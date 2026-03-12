import { useState, useMemo } from 'react';
import { ArrowRight, Plus, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Header from '../components/layout/Header';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import StatusBadge from '../components/shared/StatusBadge';
import SkeletonTable from '../components/shared/SkeletonTable';
import ToastContainer from '../components/shared/ToastContainer';
import Pagination from '../components/shared/Pagination';
import DetailDrawer from '../components/shared/DetailDrawer';
import ExportDropdown from '../components/shared/ExportDropdown';
import CreatePurchaseOrderModal from '../components/purchase-orders/CreatePurchaseOrderModal';
import PurchaseOrderDetail from '../components/purchase-orders/PurchaseOrderDetail';
import { usePurchaseOrdersList, useUpdatePurchaseOrderStatus, purchaseOrderKeys } from '../hooks/queries/usePurchaseOrderQueries';
import { exportToCsv } from '../utils/exportCsv';
import { exportTableToPdf } from '../utils/exportPdf';
import { useToast } from '../hooks/useToastSimple';
import { useTableSort } from '../hooks/useTableSort';
import { usePagination } from '../hooks/usePagination';
import { formatCurrency } from '../hooks/useSettings';
import type { PurchaseOrder, PurchaseOrderStatus } from '../types';
import styles from './CrudPage.module.css';
import dashStyles from '../styles/shared.module.css';

const statusFlow: Record<string, PurchaseOrderStatus | null> = {
  Pending: 'Approved',
  Approved: 'Shipped',
  Shipped: 'Received',
  Received: null,
  Cancelled: null,
};

const allStatuses: (PurchaseOrderStatus | 'All')[] = ['All', 'Pending', 'Approved', 'Shipped', 'Received', 'Cancelled'];

type SortKey = 'orderDate' | 'status' | 'totalAmount';

const accessor = (item: PurchaseOrder, key: SortKey) => {
  switch (key) {
    case 'orderDate': return item.orderDate;
    case 'status': return item.status;
    case 'totalAmount': return item.totalAmount;
  }
};

export default function PurchaseOrders() {
  const [filter, setFilter] = useState<PurchaseOrderStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
  const { toasts, addToast, dismiss } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading: loading } = usePurchaseOrdersList(filter === 'All' ? undefined : filter);
  const statusMutation = useUpdatePurchaseOrderStatus();

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) =>
      o.supplierName.toLowerCase().includes(q) ||
      `PO-${String(o.id).padStart(4, '0')}`.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const { sortedItems, toggleSort, getSortIndicator } = useTableSort<PurchaseOrder, SortKey>(filtered, accessor);
  const { paginatedItems, page, pageSize, totalPages, setPage, setPageSize, startIndex, endIndex, totalItems } = usePagination(sortedItems);

  const advanceStatus = async (id: number, currentStatus: PurchaseOrderStatus) => {
    const next = statusFlow[currentStatus];
    if (!next) return;
    try {
      await statusMutation.mutateAsync({ id, status: next });
      addToast(`Order advanced to ${next}`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to advance order status', 'danger');
    }
  };

  const exportHeaders = ['PO #', 'Supplier', 'Status', 'Total Amount', 'Order Date'];
  const toExportRows = () =>
    orders.map((o) => [
      `PO-${String(o.id).padStart(4, '0')}`, o.supplierName, o.status,
      String(o.totalAmount), new Date(o.orderDate).toLocaleDateString(),
    ]);

  const handleExportCsv = () => {
    exportToCsv('purchase-orders.csv', exportHeaders, orders.map((o) => [
      `PO-${String(o.id).padStart(4, '0')}`, o.supplierName, o.status,
      o.totalAmount, new Date(o.orderDate).toLocaleDateString(),
    ]));
  };

  const handleExportPdf = () => {
    exportTableToPdf('Purchase Orders', exportHeaders, toExportRows(), 'purchase-orders');
  };

  const pipelineCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const fmtCurrency = (n: number) => formatCurrency(n, 2);

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
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
            <div className={styles.filterRow} style={{ margin: 0 }}>
              {allStatuses.map((s) => (
                <button key={s} className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`} onClick={() => setFilter(s)}>
                  {s}
                </button>
              ))}
            </div>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Search orders..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ExportDropdown onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} />
            <Button variant="primary" size="md" onClick={() => setCreateModalOpen(true)}>
              <Plus size={14} /> Create PO
            </Button>
          </div>
        </div>

        <Card title="Purchase Orders" count={totalItems} noPadding>
          <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>PO #</th>
                <th>Supplier</th>
                <th className={`${styles.sortable} ${styles.hideMobile}`} onClick={() => toggleSort('orderDate')}>Date{getSortIndicator('orderDate')}</th>
                <th className={styles.sortable} onClick={() => toggleSort('status')}>Status{getSortIndicator('status')}</th>
                <th className={styles.sortable} onClick={() => toggleSort('totalAmount')}>Total{getSortIndicator('totalAmount')}</th>
                <th></th>
              </tr>
            </thead>
            {loading ? (
              <SkeletonTable rows={5} cols={6} />
            ) : (
            <tbody>
              {paginatedItems.length === 0 && (
                <tr><td colSpan={6} className={styles.empty}>No purchase orders found</td></tr>
              )}
              {paginatedItems.map((o) => (
                <tr key={o.id} onClick={() => setDetailOrderId(o.id)} style={{ cursor: 'pointer' }}>
                  <td className={`${styles.mono} ${styles.primary}`}>PO-{String(o.id).padStart(4, '0')}</td>
                  <td>{o.supplierName}</td>
                  <td className={`${styles.mono} ${styles.hideMobile}`}>{new Date(o.orderDate).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge variant={o.status.toLowerCase() as 'pending' | 'approved' | 'shipped' | 'received' | 'cancelled'}>
                      {o.status}
                    </StatusBadge>
                  </td>
                  <td className={styles.mono}>{fmtCurrency(o.totalAmount)}</td>
                  <td>
                    {statusFlow[o.status] && (
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); advanceStatus(o.id, o.status); }}>
                        {statusFlow[o.status]} <ArrowRight size={12} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            )}
          </table>
          </div>
          <Pagination
            page={page} totalPages={totalPages} pageSize={pageSize}
            totalItems={totalItems} startIndex={startIndex} endIndex={endIndex}
            onPageChange={setPage} onPageSizeChange={setPageSize}
          />
        </Card>
        <CreatePurchaseOrderModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all })}
          addToast={addToast}
        />

        <DetailDrawer
          open={detailOrderId !== null}
          onClose={() => setDetailOrderId(null)}
          title={detailOrderId ? `PO-${String(detailOrderId).padStart(4, '0')}` : 'Order Details'}
        >
          {detailOrderId && <PurchaseOrderDetail orderId={detailOrderId} />}
        </DetailDrawer>

        <ToastContainer toasts={toasts} dismiss={dismiss} />
      </main>
    </>
  );
}
