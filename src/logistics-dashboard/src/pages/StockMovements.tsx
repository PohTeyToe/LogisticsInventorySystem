import { useEffect, useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import StatusBadge from '../components/shared/StatusBadge';
import SkeletonTable from '../components/shared/SkeletonTable';
import ToastContainer from '../components/shared/ToastContainer';
import { getStockMovements } from '../api/stockMovements';
import { exportToCsv } from '../utils/exportCsv';
import { useToast } from '../hooks/useToastSimple';
import type { StockMovement, StockMovementType } from '../types';
import styles from './CrudPage.module.css';

const allTypes: (StockMovementType | 'All')[] = ['All', 'IN', 'OUT', 'ADJUSTMENT'];

export default function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filter, setFilter] = useState<StockMovementType | 'All'>('All');
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, dismiss } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMovements(await getStockMovements(filter === 'All' ? {} : { type: filter }));
    } catch (err) { console.error(err); addToast('Failed to load stock movements', 'danger'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    const headers = ['Timestamp', 'Item', 'SKU', 'Type', 'Quantity', 'Reason'];
    const rows = movements.map((m) => [
      new Date(m.timestamp).toLocaleString(), m.itemName, m.itemSku,
      m.type, m.quantity, m.reason || '',
    ]);
    exportToCsv('stock-movements.csv', headers, rows);
  };

  return (
    <>
      <Header title="Stock Movements" />
      <main className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.filterRow} style={{ margin: 0 }}>
          {allTypes.map((t) => (
            <button key={t} className={`${styles.filterBtn} ${filter === t ? styles.filterActive : ''}`} onClick={() => setFilter(t)}>
              {t}
            </button>
          ))}
          </div>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download size={14} /> Export
          </Button>
        </div>

        <Card title="Movement History" count={movements.length} noPadding>
          <table className={styles.table}>
            <thead>
              <tr><th>Timestamp</th><th>Item</th><th>SKU</th><th>Type</th><th>Qty</th><th>Reason</th></tr>
            </thead>
            {loading ? (
              <SkeletonTable rows={8} cols={6} />
            ) : (
            <tbody>
              {movements.length === 0 && (
                <tr><td colSpan={6} className={styles.empty}>No stock movements found</td></tr>
              )}
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className={styles.mono}>{new Date(m.timestamp).toLocaleString()}</td>
                  <td className={styles.primary}>{m.itemName}</td>
                  <td className={styles.mono}>{m.itemSku}</td>
                  <td>
                    <StatusBadge variant={m.type === 'IN' ? 'in' : m.type === 'OUT' ? 'out' : 'adjustment'}>
                      {m.type}
                    </StatusBadge>
                  </td>
                  <td className={styles.mono}>{m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : ''}{m.quantity}</td>
                  <td>{m.reason || '-'}</td>
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
