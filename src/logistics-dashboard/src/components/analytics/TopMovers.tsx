import Card from '../shared/Card';
import SkeletonTable from '../shared/SkeletonTable';
import StatusBadge from '../shared/StatusBadge';
import type { TopMover } from './analyticsHelpers';
import styles from './TopMovers.module.css';

interface TopMoversProps {
  data: TopMover[];
  loading: boolean;
}

export default function TopMovers({ data, loading }: TopMoversProps) {
  if (loading) {
    return (
      <Card title="Top Movers by Volume" count="Top 10" noPadding>
        <SkeletonTable rows={10} cols={6} standalone />
      </Card>
    );
  }

  return (
    <Card title="Top Movers by Volume" count="Top 10" noPadding>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>IN Count</th>
            <th>OUT Count</th>
            <th>Net Change</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr><td colSpan={6} className={styles.empty}>No movement data</td></tr>
          )}
          {data.map((m) => (
            <tr key={m.sku}>
              <td className={`${styles.mono} ${styles.primaryText}`}>{m.sku}</td>
              <td className={styles.primaryText}>{m.name}</td>
              <td className={`${styles.mono} ${styles.positive}`}>+{m.inCount}</td>
              <td className={`${styles.mono} ${styles.negative}`}>-{m.outCount}</td>
              <td className={`${styles.mono} ${m.netChange > 0 ? styles.positive : m.netChange < 0 ? styles.negative : styles.neutral}`}>
                {m.netChange > 0 ? '+' : ''}{m.netChange}
              </td>
              <td>
                <StatusBadge variant={m.netChange > 0 ? 'in' : m.netChange < 0 ? 'out' : 'adjustment'}>
                  {m.netChange > 0 ? 'Net In' : m.netChange < 0 ? 'Net Out' : 'Balanced'}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
