import { memo } from 'react';
import { BarChart3, Clock, Target, DollarSign } from 'lucide-react';
import KpiCard from '../shared/KpiCard';
import SkeletonKpiRow from '../shared/SkeletonKpiRow';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';
import { fmtCurrencyCounter } from './chartUtils';
import styles from './AnalyticsKpiRow.module.css';

export interface AnalyticsKpiRowProps {
  turnoverRate: number;
  avgDaysRestock: number;
  stockAccuracy: number;
  carryingCost: number;
  loading: boolean;
}

const AnalyticsKpiRow = memo(function AnalyticsKpiRow({
  turnoverRate, avgDaysRestock, stockAccuracy, carryingCost, loading,
}: AnalyticsKpiRowProps) {
  const turnover = useAnimatedCounter({
    target: turnoverRate,
    formatter: (n) => n.toFixed(2),
    enabled: !loading,
  });
  const restock = useAnimatedCounter({
    target: avgDaysRestock,
    formatter: (n) => avgDaysRestock === 0 ? 'N/A' : `${Math.round(n)}d`,
    enabled: !loading,
    duration: 800,
  });
  const accuracy = useAnimatedCounter({
    target: stockAccuracy,
    formatter: (n) => `${n.toFixed(1)}%`,
    enabled: !loading,
  });
  const carrying = useAnimatedCounter({
    target: carryingCost,
    formatter: fmtCurrencyCounter,
    enabled: !loading,
  });

  if (loading) return <SkeletonKpiRow />;

  return (
    <div className={styles.kpiRow}>
      <KpiCard label="Inventory Turnover" value={turnover.value} valueRef={turnover.ref} icon={<BarChart3 size={18} />} variant="teal" delay={50} />
      <KpiCard label="Avg Days to Restock" value={restock.value} valueRef={restock.ref} icon={<Clock size={18} />} variant="blue" delay={100} />
      <KpiCard label="Stock Accuracy" value={accuracy.value} valueRef={accuracy.ref} icon={<Target size={18} />} variant="green" delay={150} />
      <KpiCard label="Carrying Cost" value={carrying.value} valueRef={carrying.ref} icon={<DollarSign size={18} />} variant="amber" delay={200} />
    </div>
  );
});

export default AnalyticsKpiRow;
