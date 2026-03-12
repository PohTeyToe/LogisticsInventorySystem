import { useMemo } from 'react';
import type { InventoryItem, StockMovement } from '../../types';
import StatusBadge from './StatusBadge';
import Sparkline from './Sparkline';
import styles from './InventoryDetail.module.css';

interface InventoryDetailProps {
  item: InventoryItem;
  movements: StockMovement[];
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

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function movementVariant(type: string): 'in' | 'out' | 'adjustment' {
  if (type === 'IN') return 'in';
  if (type === 'OUT') return 'out';
  return 'adjustment';
}

export default function InventoryDetail({ item, movements }: InventoryDetailProps) {
  const isLowStock = item.quantity <= item.reorderLevel;
  const totalValue = item.quantity * item.unitPrice;

  // Stock level gauge
  const gaugeMax = Math.max(item.reorderLevel * 4, item.quantity * 1.2, 1);
  const fillPct = Math.min((item.quantity / gaugeMax) * 100, 100);
  const thresholdPct = Math.min((item.reorderLevel / gaugeMax) * 100, 100);

  let gaugeStatus: 'critical' | 'adequate' | 'healthy';
  if (item.quantity <= item.reorderLevel) gaugeStatus = 'critical';
  else if (item.quantity <= item.reorderLevel * 3) gaugeStatus = 'adequate';
  else gaugeStatus = 'healthy';

  // Synthetic price trend data
  const priceHistory = useMemo(() => {
    const seed = item.id * 7 + 13;
    return Array.from({ length: 7 }, (_, i) => {
      const noise = Math.sin(seed + i * 2.1) * 0.15;
      return +(item.unitPrice * (1 + noise)).toFixed(2);
    });
  }, [item.id, item.unitPrice]);

  return (
    <div className={styles.root}>
      {/* Header area */}
      <div className={styles.headerArea}>
        <h3 className={styles.itemName}>{item.name}</h3>
        <div className={styles.badges}>
          <span className={styles.skuBadge}>{item.sku}</span>
          {isLowStock ? (
            <StatusBadge variant="danger">Low Stock</StatusBadge>
          ) : (
            <StatusBadge variant="success">In Stock</StatusBadge>
          )}
        </div>
        {item.description && (
          <p className={styles.description}>{item.description}</p>
        )}
      </div>

      {/* Quick Stats Grid */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Quick Stats</h4>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Current Qty</span>
            <span className={`${styles.statValue} ${isLowStock ? styles.danger : ''}`}>
              {item.quantity.toLocaleString()}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Unit Price</span>
            <span className={styles.statValue}>{formatCurrency(item.unitPrice)}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Value</span>
            <span className={styles.statValue}>{formatCurrency(totalValue)}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Reorder Level</span>
            <span className={styles.statValue}>{item.reorderLevel.toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Details</h4>
        <dl className={styles.detailList}>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>Category</dt>
            <dd className={styles.detailValue}>{item.categoryName}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>Warehouse</dt>
            <dd className={styles.detailValue}>{item.warehouseName}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>Location</dt>
            <dd className={styles.detailValue}>{item.location || 'Not specified'}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>Created</dt>
            <dd className={styles.detailValue}>{formatDate(item.createdAt)}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>Last Updated</dt>
            <dd className={styles.detailValue}>{formatDate(item.updatedAt)}</dd>
          </div>
        </dl>
      </section>

      {/* Stock Level Gauge */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Stock Level</h4>
        <div className={styles.gaugeContainer}>
          <div className={styles.gaugeTrack}>
            <div
              className={`${styles.gaugeFill} ${styles[gaugeStatus]}`}
              style={{ width: `${fillPct}%` }}
            />
            <div
              className={styles.gaugeThreshold}
              style={{ left: `${thresholdPct}%` }}
              title={`Reorder level: ${item.reorderLevel}`}
            />
          </div>
          <div className={styles.gaugeLabels}>
            <span>0</span>
            <span className={styles.gaugeThresholdLabel} style={{ left: `${thresholdPct}%` }}>
              Reorder: {item.reorderLevel}
            </span>
            <span>{Math.round(gaugeMax)}</span>
          </div>
        </div>
      </section>

      {/* Price Trend */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Price Trend</h4>
        <div className={styles.sparklineWrap}>
          <Sparkline data={priceHistory} color="#58A6FF" filled width={200} height={40} />
        </div>
      </section>

      {/* Movement History */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Movement History</h4>
        {movements.length === 0 ? (
          <p className={styles.emptyState}>No stock movements recorded for this item.</p>
        ) : (
          <table className={styles.movementTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className={styles.mono}>{formatTimestamp(m.timestamp)}</td>
                  <td>
                    <StatusBadge variant={movementVariant(m.type)}>{m.type}</StatusBadge>
                  </td>
                  <td className={styles.mono}>{m.quantity}</td>
                  <td>{m.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
