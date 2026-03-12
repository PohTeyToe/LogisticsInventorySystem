import { useEffect, useState, useCallback } from 'react';
import { Package, DollarSign, AlertTriangle, Layers, Download } from 'lucide-react';
import Header from '../components/layout/Header';
import KpiCard from '../components/shared/KpiCard';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import StatusBadge from '../components/shared/StatusBadge';
import SkeletonKpiRow from '../components/shared/SkeletonKpiRow';
import { getValuationReport, getLowStockReport } from '../api/reports';
import { exportToCsv } from '../utils/exportCsv';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { ValuationReport, LowStockAlert } from '../types';
// Reuses Dashboard grid layout classes
import styles from './Dashboard.module.css';

const COLORS = ['#00D4AA', '#58A6FF', '#F59E0B', '#3FB950', '#F85149', '#A371F7', '#D2A8FF', '#8B949E'];

const getVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const fmtCurrency = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function Reports() {
  const [report, setReport] = useState<ValuationReport | null>(null);
  const [lowStock, setLowStock] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [r, ls] = await Promise.all([getValuationReport(), getLowStockReport()]);
        setReport(r);
        setLowStock(ls);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const totalItems = report?.totalItems || 0;
  const categoryCount = report?.categoryBreakdown?.length || 0;
  const totalValue = report?.totalValue || 0;
  const lowStockCount = lowStock.length;
  const catData = report?.categoryBreakdown?.map((c) => ({ name: c.categoryName, value: c.totalValue, items: c.itemCount })) || [];
  const whData = report?.warehouseBreakdown?.map((w) => ({ name: w.warehouseName, value: w.totalValue, items: w.itemCount })) || [];

  const fmtInt = useCallback((n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','), []);
  const fmtDollar = useCallback((n: number) => `$${Math.round(n).toLocaleString()}`, []);

  const animatedTotalItems = useAnimatedCounter({ target: totalItems, formatter: fmtInt, enabled: !loading });
  const animatedCategories = useAnimatedCounter({ target: categoryCount, formatter: fmtInt, enabled: !loading });
  const animatedTotalValue = useAnimatedCounter({ target: totalValue, formatter: fmtDollar, enabled: !loading });
  const animatedLowStock = useAnimatedCounter({ target: lowStockCount, formatter: fmtInt, enabled: !loading });

  const handleExportCategories = () => {
    const headers = ['Category', 'Item Count', 'Total Value'];
    const rows = catData.map((c) => [c.name, c.items, c.value]);
    exportToCsv('category-breakdown.csv', headers, rows);
  };

  const handleExportWarehouses = () => {
    const headers = ['Warehouse', 'Item Count', 'Total Value'];
    const rows = whData.map((w) => [w.name, w.items, w.value]);
    exportToCsv('warehouse-breakdown.csv', headers, rows);
  };

  return (
    <>
      <Header title="Reports" />
      <main className={styles.content}>
        {loading ? (
          <SkeletonKpiRow />
        ) : (
          <div className={styles.kpiRow}>
            <KpiCard label="Total Items" value={animatedTotalItems} icon={<Package size={18} />} variant="teal" delay={50} />
            <KpiCard label="Categories" value={animatedCategories} icon={<Layers size={18} />} variant="blue" delay={100} />
            <KpiCard label="Total Value" value={animatedTotalValue} icon={<DollarSign size={18} />} variant="green" delay={150} />
            <KpiCard label="Low Stock Items" value={animatedLowStock} icon={<AlertTriangle size={18} />} variant="amber" delay={200} />
          </div>
        )}

        <div className={styles.contentGridFull}>
          <Card title="Value by Category" actions={catData.length > 0 ? <Button variant="ghost" size="sm" onClick={handleExportCategories}><Download size={14} /> Export</Button> : undefined}>
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catData} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tick={{ fill: getVar('--text-muted'), fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: getVar('--text-muted'), fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: getVar('--bg-surface'), border: `1px solid ${getVar('--border-muted')}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: getVar('--text-primary') }} formatter={(value) => [fmtCurrency(Number(value)), 'Value']} />
                  <Bar dataKey="value" fill="#00D4AA" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyState}>No data</div>
            )}
          </Card>

          <Card title="Value by Warehouse" actions={whData.length > 0 ? <Button variant="ghost" size="sm" onClick={handleExportWarehouses}><Download size={14} /> Export</Button> : undefined}>
            {whData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={whData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {whData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
