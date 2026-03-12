import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import {
  AnalyticsKpiRow,
  AbcAnalysis,
  MovementTrends,
  CategoryDistribution,
  TopMovers,
} from '../components/analytics';
import {
  computeAbcAnalysis,
  computeMovementTrends,
  computeTopMovers,
  computeCategoryTreemap,
} from '../components/analytics/analyticsHelpers';
import { useAllInventoryItems } from '../hooks/queries/useInventoryQueries';
import { useStockMovementsList } from '../hooks/queries/useStockMovementQueries';
import { useValuationReport } from '../hooks/queries/useReportQueries';
import styles from './Analytics.module.css';

export default function Analytics() {
  const { onSearchClick } = useOutletContext<{ onSearchClick?: () => void }>();

  const { data: inventoryItems = [], isLoading: invLoading } = useAllInventoryItems(100);
  const { data: movements = [], isLoading: mvtLoading } = useStockMovementsList();
  const { data: report, isLoading: rptLoading } = useValuationReport();
  const loading = invLoading || mvtLoading || rptLoading;

  // ---------- Computed data ----------
  const abcData = useMemo(() => computeAbcAnalysis(inventoryItems), [inventoryItems]);
  const trendData = useMemo(() => computeMovementTrends(movements), [movements]);
  const topMovers = useMemo(() => computeTopMovers(movements), [movements]);
  const treemapData = useMemo(() => (report ? computeCategoryTreemap(report) : []), [report]);

  // ---------- KPI calculations ----------
  const totalOutQty = useMemo(
    () => movements.filter((m) => m.type === 'OUT').reduce((s, m) => s + m.quantity, 0),
    [movements],
  );
  const avgInventoryValue = useMemo(() => {
    if (!report) return 0;
    return report.totalValue || 0;
  }, [report]);

  const turnoverRate = useMemo(
    () => avgInventoryValue > 0 ? totalOutQty / (avgInventoryValue / 100) : 0,
    [totalOutQty, avgInventoryValue],
  );

  const avgDaysRestock = useMemo(() => {
    const inMovements = movements
      .filter((m) => m.type === 'IN')
      .map((m) => new Date(m.timestamp).getTime())
      .sort((a, b) => a - b);
    if (inMovements.length < 2) return 0;
    let totalGap = 0;
    for (let i = 1; i < inMovements.length; i++) {
      totalGap += inMovements[i] - inMovements[i - 1];
    }
    return Math.round(totalGap / (inMovements.length - 1) / (1000 * 60 * 60 * 24));
  }, [movements]);

  const stockAccuracy = useMemo(() => {
    if (inventoryItems.length === 0) return 0;
    const inStock = inventoryItems.filter((it) => it.quantity > 0).length;
    return (inStock / inventoryItems.length) * 100;
  }, [inventoryItems]);

  const carryingCost = useMemo(() => (report?.totalValue || 0) * 0.25, [report]);

  return (
    <>
      <Header title="Analytics" subtitle="Inventory performance insights" onSearchClick={onSearchClick} />
      <main className={styles.content}>
        <AnalyticsKpiRow
          turnoverRate={turnoverRate}
          avgDaysRestock={avgDaysRestock}
          stockAccuracy={stockAccuracy}
          carryingCost={carryingCost}
          loading={loading}
        />

        <div className={styles.chartGrid}>
          <AbcAnalysis data={abcData} loading={loading} />
          <MovementTrends data={trendData} loading={loading} />
        </div>

        <div className={styles.chartGridFull}>
          <CategoryDistribution data={treemapData} loading={loading} />
        </div>

        <TopMovers data={topMovers} loading={loading} />
      </main>
    </>
  );
}
