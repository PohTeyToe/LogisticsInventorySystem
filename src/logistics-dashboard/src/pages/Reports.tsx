import { useCallback } from 'react';
import { Package, DollarSign, AlertTriangle, Layers } from 'lucide-react';
import Header from '../components/layout/Header';
import KpiCard from '../components/shared/KpiCard';
import Card from '../components/shared/Card';
import StatusBadge from '../components/shared/StatusBadge';
import SkeletonKpiRow from '../components/shared/SkeletonKpiRow';
import ExportDropdown from '../components/shared/ExportDropdown';
import { useValuationReport, useLowStockReport } from '../hooks/queries/useReportQueries';
import { exportToCsv } from '../utils/exportCsv';
import { exportTableToPdf } from '../utils/exportPdf';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { formatCurrency, formatCurrencyCounter } from '../hooks/useSettings';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import styles from '../styles/shared.module.css';

// Chart palette — values match CSS variables --chart-color-1 through --chart-color-8 in theme.css
const CHART_COLORS = ['#00D4AA', '#58A6FF', '#F59E0B', '#3FB950', '#F85149', '#A371F7', '#D2A8FF', '#8B949E'];

const getVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const fmtCurrency = (n: number) => formatCurrency(n, 0);

export default function Reports() {
  const { data: report, isLoading: reportLoading } = useValuationReport();
  const { data: lowStock = [], isLoading: lowStockLoading } = useLowStockReport();
  const loading = reportLoading || lowStockLoading;

  const totalItems = report?.totalItems || 0;
  const categoryCount = report?.categoryBreakdown?.length || 0;
  const totalValue = report?.totalValue || 0;
  const lowStockCount = lowStock.length;
  const catData = report?.categoryBreakdown?.map((c) => ({ name: c.categoryName, value: c.totalValue, items: c.itemCount })) || [];
  const whData = report?.warehouseBreakdown?.map((w) => ({ name: w.warehouseName, value: w.totalValue, items: w.itemCount })) || [];

  const fmtInt = useCallback((n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','), []);
  const fmtDollar = useCallback((n: number) => formatCurrencyCounter(n), []);

  const animatedTotalItems = useAnimatedCounter({ target: totalItems, formatter: fmtInt, enabled: !loading });
  const animatedCategories = useAnimatedCounter({ target: categoryCount, formatter: fmtInt, enabled: !loading });
  const animatedTotalValue = useAnimatedCounter({ target: totalValue, formatter: fmtDollar, enabled: !loading });
  const animatedLowStock = useAnimatedCounter({ target: lowStockCount, formatter: fmtInt, enabled: !loading });

  const handleExportCategoriesCsv = () => {
    const headers = ['Category', 'Item Count', 'Total Value'];
    const rows = catData.map((c) => [c.name, c.items, c.value]);
    exportToCsv('category-breakdown.csv', headers, rows);
  };

  const handleExportCategoriesPdf = () => {
    const headers = ['Category', 'Item Count', 'Total Value'];
    const rows = catData.map((c) => [c.name, String(c.items), String(c.value)]);
    exportTableToPdf('Value by Category', headers, rows, 'category-breakdown');
  };

  const handleExportWarehousesCsv = () => {
    const headers = ['Warehouse', 'Item Count', 'Total Value'];
    const rows = whData.map((w) => [w.name, w.items, w.value]);
    exportToCsv('warehouse-breakdown.csv', headers, rows);
  };

  const handleExportWarehousesPdf = () => {
    const headers = ['Warehouse', 'Item Count', 'Total Value'];
    const rows = whData.map((w) => [w.name, String(w.items), String(w.value)]);
    exportTableToPdf('Value by Warehouse', headers, rows, 'warehouse-breakdown');
  };

  return (
    <>
      <Header title="Reports" />
      <main className={styles.content}>
        {loading ? (
          <SkeletonKpiRow />
        ) : (
          <div className={styles.kpiRow}>
            <KpiCard label="Total Items" value={animatedTotalItems.value} valueRef={animatedTotalItems.ref} icon={<Package size={18} />} variant="teal" delay={50} />
            <KpiCard label="Categories" value={animatedCategories.value} valueRef={animatedCategories.ref} icon={<Layers size={18} />} variant="blue" delay={100} />
            <KpiCard label="Total Value" value={animatedTotalValue.value} valueRef={animatedTotalValue.ref} icon={<DollarSign size={18} />} variant="green" delay={150} />
            <KpiCard label="Low Stock Items" value={animatedLowStock.value} valueRef={animatedLowStock.ref} icon={<AlertTriangle size={18} />} variant="amber" delay={200} />
          </div>
        )}

        <div className={styles.contentGridFull}>
          <Card title="Value by Category" actions={catData.length > 0 ? <ExportDropdown onExportCsv={handleExportCategoriesCsv} onExportPdf={handleExportCategoriesPdf} /> : undefined}>
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catData} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tick={{ fill: getVar('--text-muted'), fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: getVar('--text-muted'), fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: getVar('--bg-surface'), border: `1px solid ${getVar('--border-muted')}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: getVar('--text-primary') }} formatter={(value) => [fmtCurrency(Number(value)), 'Value']} />
                  <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyState}>No data</div>
            )}
          </Card>

          <Card title="Value by Warehouse" actions={whData.length > 0 ? <ExportDropdown onExportCsv={handleExportWarehousesCsv} onExportPdf={handleExportWarehousesPdf} /> : undefined}>
            {whData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={whData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {whData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: getVar('--bg-surface'), border: `1px solid ${getVar('--border-muted')}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: getVar('--text-primary') }} formatter={(value) => [fmtCurrency(Number(value)), 'Value']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyState}>No data</div>
            )}
          </Card>
        </div>

        {lowStock.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Card title="Low Stock Alerts" count={lowStock.length} noPadding>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-muted)' }}>SKU</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-muted)' }}>Name</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-muted)' }}>Warehouse</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-muted)' }}>Current Qty</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-muted)' }}>Reorder Level</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item) => (
                    <tr key={item.itemId} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-data)', fontSize: 12 }}>{item.sku}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{item.warehouseName}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--status-danger)' }}>{item.currentQuantity}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-data)', fontSize: 12 }}>{item.reorderLevel}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <StatusBadge variant={item.currentQuantity === 0 ? 'danger' : 'warning'}>
                          {item.currentQuantity === 0 ? 'Out of Stock' : 'Low Stock'}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
