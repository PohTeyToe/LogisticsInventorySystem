import { useEffect, useState, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BarChart3, Clock, Target, DollarSign } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/shared/Card';
import KpiCard from '../components/shared/KpiCard';
import SkeletonKpiRow from '../components/shared/SkeletonKpiRow';
import SkeletonTable from '../components/shared/SkeletonTable';
import StatusBadge from '../components/shared/StatusBadge';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { getInventory } from '../api/inventory';
import { getStockMovements } from '../api/stockMovements';
import { getValuationReport } from '../api/reports';
import type { InventoryItem, StockMovement, ValuationReport } from '../types';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, Treemap,
} from 'recharts';
import styles from './Analytics.module.css';

const COLORS = ['#00D4AA', '#58A6FF', '#F59E0B', '#3FB950', '#F85149', '#A371F7', '#D2A8FF', '#8B949E'];

const getVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtCurrencyCounter = (n: number) => `$${Math.round(n).toLocaleString()}`;

// ---------- ABC Analysis helpers ----------
interface AbcItem {
  name: string;
  sku: string;
  value: number;
  cumulativePct: number;
  abcClass: 'A' | 'B' | 'C';
}

function computeAbcAnalysis(items: InventoryItem[]): AbcItem[] {
  const valued = items
    .map((it) => ({ name: it.name, sku: it.sku, value: it.quantity * it.unitPrice }))
    .sort((a, b) => b.value - a.value);

  const totalValue = valued.reduce((s, v) => s + v.value, 0);
  if (totalValue === 0) return [];

  let cumulative = 0;
  return valued.map((it, idx) => {
    cumulative += it.value;
    const cumulativePct = (cumulative / totalValue) * 100;
    const abcClass = idx === 0 ? 'A' : cumulativePct <= 80 ? 'A' : cumulativePct <= 95 ? 'B' : 'C';
    return { ...it, cumulativePct, abcClass };
  });
}

const ABC_COLORS: Record<string, string> = { A: '#00D4AA', B: '#58A6FF', C: '#484F58' };

// ---------- Movement trend helpers ----------
interface MovementTrend {
  date: string;
  inQty: number;
  outQty: number;
}

function computeMovementTrends(movements: StockMovement[]): MovementTrend[] {
  const byDate = new Map<string, { inQty: number; outQty: number }>();
  for (const m of movements) {
    const date = new Date(m.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const entry = byDate.get(date) || { inQty: 0, outQty: 0 };
    if (m.type === 'IN') entry.inQty += m.quantity;
    else if (m.type === 'OUT') entry.outQty += m.quantity;
    byDate.set(date, entry);
  }
  return Array.from(byDate.entries())
    .map(([date, vals]) => ({ date, ...vals }))
    .reverse();
}

// ---------- Top movers ----------
interface TopMover {
  sku: string;
  name: string;
  inCount: number;
  outCount: number;
  netChange: number;
}

function computeTopMovers(movements: StockMovement[]): TopMover[] {
  const map = new Map<string, TopMover>();
  for (const m of movements) {
    const existing = map.get(m.itemSku) || { sku: m.itemSku, name: m.itemName, inCount: 0, outCount: 0, netChange: 0 };
    if (m.type === 'IN') {
      existing.inCount += m.quantity;
      existing.netChange += m.quantity;
    } else if (m.type === 'OUT') {
      existing.outCount += m.quantity;
      existing.netChange -= m.quantity;
    }
    map.set(m.itemSku, existing);
  }
  return Array.from(map.values())
    .sort((a, b) => (b.inCount + b.outCount) - (a.inCount + a.outCount))
    .slice(0, 10);
}

// ---------- Treemap data ----------
interface TreemapNode {
  name: string;
  size: number;
  fill: string;
  [key: string]: unknown;
}

function computeCategoryTreemap(report: ValuationReport): TreemapNode[] {
  return (report.categoryBreakdown || [])
    .filter((c) => c.totalValue > 0)
    .map((c, i) => ({
      name: c.categoryName,
      size: c.totalValue,
      fill: COLORS[i % COLORS.length],
    }));
}

// ---------- Custom Treemap content ----------
interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  size: number;
  fill: string;
}

function CustomTreemapContent({ x, y, width, height, name, size, fill }: TreemapContentProps) {
  if (width < 40 || height < 30) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} opacity={0.85} rx={4} ry={4} stroke="var(--bg-surface)" strokeWidth={2} />
      <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" className={styles.treemapLabel}>
        {name.length > 12 ? name.slice(0, 12) + '...' : name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" className={styles.treemapValue}>
        {fmtCurrency(size)}
      </text>
    </g>
  );
}

// ---------- Custom tooltips ----------

export default function Analytics() {
  const { onSearchClick } = useOutletContext<{ onSearchClick?: () => void }>();

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [report, setReport] = useState<ValuationReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, mvts, rpt] = await Promise.all([
        getInventory(1, 100),
        getStockMovements({}),
        getValuationReport(),
      ]);
      setInventoryItems(inv.items);
      setMovements(mvts);
      setReport(rpt);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  // ---------- Animated counters ----------
  const turnoverDisplay = useAnimatedCounter({
    target: turnoverRate,
    formatter: (n) => n.toFixed(2),
    enabled: !loading,
  });
  const restockDisplay = useAnimatedCounter({
    target: avgDaysRestock,
    formatter: (n) => avgDaysRestock === 0 ? 'N/A' : `${Math.round(n)}d`,
    enabled: !loading,
    duration: 800,
  });
  const accuracyDisplay = useAnimatedCounter({
    target: stockAccuracy,
    formatter: (n) => `${n.toFixed(1)}%`,
    enabled: !loading,
  });
  const carryingDisplay = useAnimatedCounter({
    target: carryingCost,
    formatter: fmtCurrencyCounter,
    enabled: !loading,
  });

  return (
    <>
      <Header title="Analytics" subtitle="Inventory performance insights" onSearchClick={onSearchClick} />
      <main className={styles.content}>
        {/* Section 1: KPI Summary */}
        {loading ? (
          <SkeletonKpiRow />
        ) : (
          <div className={styles.kpiRow}>
            <KpiCard
              label="Inventory Turnover"
              value={turnoverDisplay}
              icon={<BarChart3 size={18} />}
              variant="teal"
              delay={50}
            />
            <KpiCard
              label="Avg Days to Restock"
              value={restockDisplay}
              icon={<Clock size={18} />}
              variant="blue"
              delay={100}
            />
            <KpiCard
              label="Stock Accuracy"
              value={accuracyDisplay}
              icon={<Target size={18} />}
              variant="green"
              delay={150}
            />
            <KpiCard
              label="Carrying Cost"
              value={carryingDisplay}
              icon={<DollarSign size={18} />}
              variant="amber"
              delay={200}
            />
          </div>
        )}

        {/* Section 2 & 3: ABC Analysis + Movement Trends */}
        <div className={styles.chartGrid}>
          {loading ? (
            <Card title="ABC Analysis (Pareto)" noPadding>
              <div className={styles.skeletonChartArea}>Loading chart data...</div>
            </Card>
          ) : (
            <Card title="ABC Analysis (Pareto)">
              {abcData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={abcData.slice(0, 25)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="sku"
                        tick={{ fill: getVar('--text-muted'), fontSize: 9, fontFamily: 'JetBrains Mono' }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        yAxisId="value"
                        tick={{ fill: getVar('--text-muted'), fontSize: 10, fontFamily: 'JetBrains Mono' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        yAxisId="pct"
                        orientation="right"
                        domain={[0, 100]}
                        tick={{ fill: getVar('--text-muted'), fontSize: 10, fontFamily: 'JetBrains Mono' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{ background: getVar('--bg-surface'), border: `1px solid ${getVar('--border-muted')}`, borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: getVar('--text-primary') }}
                        formatter={(value, name) => {
                          if (name === 'cumulativePct') return [`${Number(value).toFixed(1)}%`, 'Cumulative'];
                          return [fmtCurrency(Number(value)), 'Value'];
                        }}
                      />
                      <Bar
                        yAxisId="value"
                        dataKey="value"
                        radius={[3, 3, 0, 0]}
                        fill="#00D4AA"
                        // Color by ABC class
                        shape={(props) => {
                          const p = props as { x: number; y: number; width: number; height: number; index: number };
                          const item = abcData[p.index];
                          const color = item ? ABC_COLORS[item.abcClass] : '#484F58';
                          return (
                            <rect
                              x={p.x}
                              y={p.y}
                              width={p.width}
                              height={p.height}
                              fill={color}
                              rx={3}
                              ry={3}
                            />
                          );
                        }}
                      />
                      <Line
                        yAxisId="pct"
                        dataKey="cumulativePct"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        dot={false}
                        type="monotone"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className={styles.abcLegend}>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: ABC_COLORS.A }} />
                      Class A (80% value)
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: ABC_COLORS.B }} />
                      Class B (15% value)
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: ABC_COLORS.C }} />
                      Class C (5% value)
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#F59E0B', borderRadius: '50%' }} />
                      Cumulative %
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>No inventory data for ABC analysis</div>
              )}
            </Card>
          )}

          {loading ? (
            <Card title="Stock Movement Trends" noPadding>
              <div className={styles.skeletonChartArea}>Loading chart data...</div>
            </Card>
          ) : (
            <Card title="Stock Movement Trends">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3FB950" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3FB950" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F85149" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F85149" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: getVar('--text-muted'), fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: getVar('--text-muted'), fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: getVar('--bg-surface'), border: `1px solid ${getVar('--border-muted')}`, borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: getVar('--text-primary') }}
                      formatter={(value, name) => [
                        Number(value),
                        name === 'inQty' ? 'Stock In' : 'Stock Out',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="inQty"
                      stackId="1"
                      stroke="#3FB950"
                      strokeWidth={2}
                      fill="url(#gradIn)"
                    />
                    <Area
                      type="monotone"
                      dataKey="outQty"
                      stackId="1"
                      stroke="#F85149"
                      strokeWidth={2}
                      fill="url(#gradOut)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.emptyState}>No movement data available</div>
              )}
            </Card>
          )}
        </div>

        {/* Section 4: Category Value Treemap */}
        <div className={styles.chartGridFull}>
          {loading ? (
            <Card title="Category Value Distribution" noPadding>
              <div className={styles.skeletonChartArea}>Loading chart data...</div>
            </Card>
          ) : (
            <Card title="Category Value Distribution">
              {treemapData.length > 0 ? (
                <div className={styles.treemapContainer}>
                  <ResponsiveContainer width="100%" height={280}>
                    <Treemap
                      data={treemapData}
                      dataKey="size"
                      aspectRatio={4 / 3}
                      stroke="var(--bg-surface)"
                      content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" size={0} fill="" />}
                    />
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={styles.emptyState}>No category data available</div>
              )}
            </Card>
          )}
        </div>

        {/* Section 5: Top Movers Table */}
        {loading ? (
          <Card title="Top Movers by Volume" count="Top 10" noPadding>
            <SkeletonTable rows={10} cols={6} />
          </Card>
        ) : (
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
                {topMovers.length === 0 && (
                  <tr><td colSpan={6} className={styles.empty}>No movement data</td></tr>
                )}
                {topMovers.map((m) => (
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
        )}
      </main>
    </>
  );
}
