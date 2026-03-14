import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Header from '../components/layout/Header';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import StatusBadge from '../components/shared/StatusBadge';
import SkeletonTable from '../components/shared/SkeletonTable';
import ToastContainer from '../components/shared/ToastContainer';
import Pagination from '../components/shared/Pagination';
import ExportDropdown from '../components/shared/ExportDropdown';
import CreateMovementModal from '../components/stock-movements/CreateMovementModal';
import { useStockMovementsList, stockMovementKeys } from '../hooks/queries/useStockMovementQueries';
import { exportToCsv } from '../utils/exportCsv';
import { exportTableToPdf } from '../utils/exportPdf';
import { useToast } from '../hooks/useToastSimple';
import { useTableSort } from '../hooks/useTableSort';
import { usePagination } from '../hooks/usePagination';
import type { StockMovement, StockMovementType } from '../types';
import styles from './CrudPage.module.css';

const allTypes: (StockMovementType | 'All')[] = ['All', 'IN', 'OUT', 'ADJUSTMENT'];

type SortKey = 'timestamp' | 'type' | 'quantity';

const accessor = (item: StockMovement, key: SortKey) => {
  switch (key) {
    case 'timestamp': return item.timestamp;
    case 'type': return item.type;
    case 'quantity': return item.quantity;
  }
};

export default function StockMovements() {
  const [filter, setFilter] = useState<StockMovementType | 'All'>('All');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const { toasts, addToast, dismiss } = useToast();
  const queryClient = useQueryClient();

  const queryParams = filter === 'All' ? undefined : { type: filter };
  const { data: movements = [], isLoading: loading } = useStockMovementsList(queryParams);

  const filtered = useMemo(() => {
    if (!search.trim()) return movements;
    const q = search.toLowerCase();
    return movements.filter((m) =>
      m.itemName.toLowerCase().includes(q) ||
      m.itemSku.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q) ||
      (m.reason && m.reason.toLowerCase().includes(q))
    );
  }, [movements, search]);

  const { sortedItems, toggleSort, getSortIndicator } = useTableSort<StockMovement, SortKey>(filtered, accessor);
  const { paginatedItems, page, pageSize, totalPages, setPage, setPageSize, startIndex, endIndex, totalItems } = usePagination(sortedItems);

  const exportHeaders = ['Timestamp', 'Item', 'SKU', 'Type', 'Quantity', 'Reason'];
  const toExportRows = () =>
    movements.map((m) => [
      new Date(m.timestamp).toLocaleString(), m.itemName, m.itemSku,
      m.type, String(m.quantity), m.reason || '',
    ]);

  const handleExportCsv = () => {
    exportToCsv('stock-movements.csv', exportHeaders, movements.map((m) => [
      new Date(m.timestamp).toLocaleString(), m.itemName, m.itemSku,
      m.type, m.quantity, m.reason || '',
    ]));
  };

  const handleExportPdf = () => {
    exportTableToPdf('Stock Movements', exportHeaders, toExportRows(), 'stock-movements');
  };

  return (
    <>
      <Header title="Stock Movements" />
      <main className={styles.content}>
        <div className={styles.toolbar}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
            <div className={styles.filterRow} style={{ margin: 0 }}>
              {allTypes.map((t) => (
                <button key={t} className={`${styles.filterBtn} ${filter === t ? styles.filterActive : ''}`} onClick={() => setFilter(t)}>
                  {t}
                </button>
              ))}
            </div>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Search movements..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="md" onClick={() => setModalOpen(true)}>
              <Plus size={14} /> Record Movement
            </Button>
            <ExportDropdown onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} />
          </div>
        </div>

        <Card title="Movement History" count={totalItems} noPadding>
          <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.sortable} onClick={() => toggleSort('timestamp')}>Timestamp{getSortIndicator('timestamp')}</th>
                <th>Item</th>
                <th className={styles.hideMobile}>SKU</th>
                <th className={styles.sortable} onClick={() => toggleSort('type')}>Type{getSortIndicator('type')}</th>
                <th className={styles.sortable} onClick={() => toggleSort('quantity')}>Qty{getSortIndicator('quantity')}</th>
                <th className={styles.hideMobile}>Reason</th>
              </tr>
            </thead>
            {loading ? (
              <SkeletonTable rows={8} cols={6} />
            ) : (
            <tbody>
              {paginatedItems.length === 0 && (
                <tr><td colSpan={6} className={styles.empty}>No stock movements found</td></tr>
              )}
              {paginatedItems.map((m) => (
                <tr key={m.id}>
                  <td className={styles.mono}>{new Date(m.timestamp).toLocaleString()}</td>
                  <td className={styles.primary}>{m.itemName}</td>
                  <td className={`${styles.mono} ${styles.hideMobile}`}>{m.itemSku}</td>
                  <td>
                    <StatusBadge variant={m.type === 'IN' ? 'in' : m.type === 'OUT' ? 'out' : 'adjustment'}>
                      {m.type}
                    </StatusBadge>
                  </td>
                  <td className={styles.mono}>{m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : ''}{m.quantity}</td>
                  <td className={styles.hideMobile}>{m.reason || '-'}</td>
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
        <CreateMovementModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={() => { addToast('Stock movement recorded', 'success'); queryClient.invalidateQueries({ queryKey: stockMovementKeys.all }); }}
        />
        <ToastContainer toasts={toasts} dismiss={dismiss} />
      </main>
    </>
  );
}
