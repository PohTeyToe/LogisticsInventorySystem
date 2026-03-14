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
import sharedStyles from '../styles/shared.module.css';
import tableStyles from './CrudPage.module.css';

function getChartColors(): string[] {
  const root = getComputedStyle(document.documentElement);
  return Array.from({ length: 8 }, (_, i) => root.getPropertyValue(`--chart-color-${i + 1}`).trim() || '#8B949E');
}

const getVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const fmtCurrency = (n: number) => formatCurrency(n, 0);

export default function Reports() {
  const chartColors = getChartColors();
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
      <main className={sharedStyles.content}>
        {loading ? (
          <SkeletonKpiRow />
        ) : (
          <div className={sharedStyles.kpiRow}>
            <KpiCard label="Total Items" value={animatedTotalItems.value} valueRef={animatedTotalItems.ref} icon={<Package size={18} />} variant="teal" delay={50} />
            <KpiCard label="Categories" value={animatedCategories.value} valueRef={animatedCategories.ref} icon={<Layers size={18} />} variant="blue" delay={100} />
            <KpiCard label="Total Value" value={animatedTotalValue.value} valueRef={animatedTotalValue.ref} icon={<DollarSign size={18} />} variant="green" delay={150} />
            <KpiCard label="Low Stock Items" value={animatedLowStock.value} valueRef={animatedLowStock.ref} icon={<AlertTriangle size={18} />} variant="amber" delay={200} />
          </div>
        )}

        <div className={sharedStyles.contentGridFull}>
          <Card title="Value by Category" actions={catData.length > 0 ? <ExportDropdown onExportCsv={handleExportCategoriesCsv} onExportPdf={handleExportCategoriesPdf} /> : undefined}>
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catData} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tick={{ fill: getVar('--text-muted'), fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: getVar('--text-muted'), fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: getVar('--bg-surface'), border: `1px solid ${getVar('--border-muted')}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: getVar('--text-primary') }} formatter={(value) => [fmtCurrency(Number(value)), 'Value']} />
                  <Bar dataKey="value" fill={chartColors[0]} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={sharedStyles.emptyState}>No data</div>
            )}
          </Card>

          <Card title="Value by Warehouse" actions={whData.length > 0 ? <ExportDropdown onExportCsv={handleExportWarehousesCsv} onExportPdf={handleExportWarehousesPdf} /> : undefined}>
            {whData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={whData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {whData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: getVar('--bg-surface'), border: `1px solid ${getVar('--border-muted')}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: getVar('--text-primary') }} formatter={(value) => [fmtCurrency(Number(value)), 'Value']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={sharedStyles.emptyState}>No data</div>
            )}
          </Card>
        </div>

        {lowStock.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Card title="Low Stock Alerts" count={lowStock.length} noPadding>
              <div className={tableStyles.tableWrap}>
                <table className={tableStyles.table}>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Name</th>
                      <th>Warehouse</th>
                      <th>Current Qty</th>
                      <th>Reorder Level</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((item) => (
                      <tr key={item.itemId}>
                        <td className={tableStyles.mono}>{item.sku}</td>
                        <td className={tableStyles.primary}>{item.name}</td>
                        <td>{item.warehouseName}</td>
                        <td className={tableStyles.mono} style={{ color: 'var(--status-danger)' }}>{item.currentQuantity}</td>
                        <td className={tableStyles.mono}>{item.reorderLevel}</td>
                        <td>
                          <StatusBadge variant={item.currentQuantity === 0 ? 'danger' : 'warning'}>
                            {item.currentQuantity === 0 ? 'Out of Stock' : 'Low Stock'}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
