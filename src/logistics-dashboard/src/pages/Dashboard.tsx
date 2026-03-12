import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Package, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import KpiCard from '../components/shared/KpiCard';
import Card from '../components/shared/Card';
import StatusBadge from '../components/shared/StatusBadge';
import Button from '../components/shared/Button';
import Sparkline from '../components/shared/Sparkline';
import SkeletonKpiRow from '../components/shared/SkeletonKpiRow';
import SkeletonTable from '../components/shared/SkeletonTable';
import ActivityFeed from '../components/shared/ActivityFeed';
import InventoryHeatmap from '../components/shared/InventoryHeatmap';
import NotificationCenter from '../components/shared/NotificationCenter';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { useSparklineData } from '../hooks/useSparklineData';
import { useNotifications } from '../hooks/useNotifications';
import { useToast } from '../hooks/useToast';
import { getValuationReport, getLowStockReport } from '../api/reports';
import { getStockMovements } from '../api/stockMovements';
import { getWarehouses } from '../api/warehouses';
import { getPurchaseOrders } from '../api/purchaseOrders';
import { getInventory } from '../api/inventory';
import { getCategories } from '../api/categories';
import type { ValuationReport, LowStockAlert, StockMovement, Warehouse, PurchaseOrder, PurchaseOrderStatus, InventoryItem, Category } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './Dashboard.module.css';

const POLL_INTERVAL = 30_000;

const fmt = (n: number) => n.toLocaleString();
const fmtCurrency = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtCurrencyCounter = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function Dashboard() {
  const { onSearchClick } = useOutletContext<{ onSearchClick?: () => void }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [report, setReport] = useState<ValuationReport | null>(null);
  const [lowStock, setLowStock] = useState<LowStockAlert[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevLowStockCountRef = useRef<number | null>(null);

  const load = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [r, ls, m, w, o, inv, cats] = await Promise.all([
        getValuationReport().catch(() => null),
        getLowStockReport().catch(() => []),
        getStockMovements({ limit: 6 }).catch(() => []),
        getWarehouses().catch(() => []),
        getPurchaseOrders().catch(() => []),
        getInventory(1, 100).catch(() => ({ items: [], totalCount: 0, page: 1, pageSize: 100, totalPages: 0 })),
        getCategories().catch(() => []),
      ]);
      if (r) setReport(r);
      setLowStock(ls);
      setMovements(m);
      setWarehouses(w);
      setOrders(o);
      setInventoryItems(inv.items);
      setCategories(cats);
      setLastUpdated(new Date());

      // Toast on poll refresh if low stock count increased
      if (!isInitial && prevLowStockCountRef.current !== null) {
        if (ls.length > prevLowStockCountRef.current) {
          toastRef.current(
            `${ls.length - prevLowStockCountRef.current} new low stock alert${ls.length - prevLowStockCountRef.current > 1 ? 's' : ''} detected`,
            'warning',
          );
        }
      }
      prevLowStockCountRef.current = ls.length;
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    intervalRef.current = setInterval(() => load(false), POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  // Stable formatters for animated counters (avoid new refs each render)
  const fmtItems = useCallback((n: number) => fmt(Math.round(n)), []);
  const fmtValue = useCallback((n: number) => fmtCurrencyCounter(n), []);
  const fmtCount = useCallback((n: number) => String(Math.round(n)), []);
  const fmtPercent = useCallback((n: number) => `${n.toFixed(1)}%`, []);

  // Animated counters
  const totalItemsDisplay = useAnimatedCounter({
    target: report?.totalItems || 0,
    formatter: fmtItems,
    enabled: !loading,
  });
  const totalValueDisplay = useAnimatedCounter({
    target: report?.totalValue || 0,
    formatter: fmtValue,
    enabled: !loading,
  });
  const lowStockDisplay = useAnimatedCounter({
    target: lowStock.length,
    formatter: fmtCount,
    enabled: !loading,
    duration: 800,
  });
  const computedFillRate = useMemo(() => {
    const receivedOrders = orders.filter((o) => o.status === 'Received');
    if (receivedOrders.length > 0 && orders.length > 0) {
      const totalReceived = receivedOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
      const totalOrdered = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
      return totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;
    }
    if (inventoryItems.length > 0) {
      const inStock = inventoryItems.filter((i) => i.quantity > 0).length;
      return (inStock / inventoryItems.length) * 100;
    }
    return 0;
  }, [orders, inventoryItems]);

  const fillRateDisplay = useAnimatedCounter({
    target: computedFillRate,
    formatter: fmtPercent,
    enabled: !loading,
  });

  // Sparkline data
  const sparkItems = useSparklineData({ currentValue: report?.totalItems || 0, seed: 'totalItems' });
  const sparkValue = useSparklineData({ currentValue: report?.totalValue || 0, seed: 'totalValue' });
  const sparkAlerts = useSparklineData({ currentValue: lowStock.length, seed: 'lowStock' });
  const sparkFillRate = useSparklineData({ currentValue: computedFillRate, seed: 'fillRate', volatility: 0.05 });

  const { notifications, markRead, markAllRead, dismissNotification } = useNotifications({
    lowStock,
    orders,
    movements,
  });

  const notificationSlot = (
    <NotificationCenter
      notifications={notifications}
      onMarkRead={markRead}
      onMarkAllRead={markAllRead}
      onDismiss={dismissNotification}
    />
  );

  const pipelineCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = report?.categoryBreakdown?.map((c) => ({
    name: c.categoryName.length > 10 ? c.categoryName.slice(0, 10) + '\u2026' : c.categoryName,
    value: c.totalValue,
  })) || [];

  const lastUpdatedStr = lastUpdated
    ? `Last updated: ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    : '';

  return (
    <>
      <Header title="Operations Dashboard" showLive subtitle={lastUpdatedStr} onSearchClick={onSearchClick} notificationSlot={notificationSlot} />
      <main className={styles.content}>
        {lowStock.length > 0 && (
          <div className={styles.alertBar} role="alert">
            <AlertTriangle size={18} className={styles.alertIcon} />
            <div className={styles.alertText}>
              <strong>{lowStock.length} items</strong> are below reorder threshold.
            </div>
            <Button variant="danger" size="sm" onClick={() => navigate('/reports')}>Review Alerts</Button>
          </div>
        )}

        {loading ? (
          <SkeletonKpiRow />
        ) : (
          <div className={styles.kpiRow}>
            <KpiCard
              label="Total Items"
              value={totalItemsDisplay}
              icon={<Package size={18} />}
              variant="teal"
              sparkline={<Sparkline data={sparkItems} color="#00D4AA" filled />}
              delay={50}
            />
            <KpiCard
              label="Inventory Value"
              value={totalValueDisplay}
              icon={<DollarSign size={18} />}
              variant="blue"
              sparkline={<Sparkline data={sparkValue} color="#58A6FF" filled />}
              delay={100}
            />
            <KpiCard
              label="Low Stock Alerts"
              value={lowStockDisplay}
              icon={<AlertTriangle size={18} />}
              variant="amber"
              sparkline={<Sparkline data={sparkAlerts} color="#F59E0B" filled />}
              delay={150}
            />
            <KpiCard
              label="Order Fill Rate"
              value={fillRateDisplay}
              icon={<CheckCircle size={18} />}
              variant="green"
              sparkline={<Sparkline data={sparkFillRate} color="#3FB950" filled />}
              delay={200}
            />
          </div>
        )}

        <div className={styles.contentGridWithFeed}>
          {loading ? (
            <Card title="Recent Stock Movements" count="24h" noPadding>
              <SkeletonTable rows={5} cols={6} />
            </Card>
          ) : (
            <Card title="Recent Stock Movements" count="24h" noPadding>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Item</th>
                    <th>SKU</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 && (
                    <tr><td colSpan={6} className={styles.empty}>No recent movements</td></tr>
                  )}
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td className={styles.mono}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className={styles.primaryText}>{m.itemName}</td>
                      <td className={styles.mono}>{m.itemSku}</td>
                      <td>
                        <StatusBadge variant={m.type === 'IN' ? 'in' : m.type === 'OUT' ? 'out' : 'adjustment'}>
                          {m.type}
                        </StatusBadge>
                      </td>
                      <td className={styles.mono}>{m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : '±'}{m.quantity}</td>
                      <td>{m.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          <Card title="Warehouse Utilization" noPadding>
            <div className={styles.warehouseList}>
              {warehouses.map((w) => {
                const pct = Math.round(w.utilizationPercentage || 0);
                const level = pct > 85 ? 'high' : pct > 60 ? 'mid' : 'low';
                return (
                  <div key={w.id} className={styles.warehouseItem} onClick={() => navigate('/warehouses')}>
                    <div className={styles.warehouseHeader}>
                      <span className={styles.warehouseName}>{w.name}</span>
                      <span className={styles.mono}>{w.itemCount || 0} / {fmt(w.capacity)}</span>
                    </div>
                    <div className={styles.utilBar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${w.name} utilization`}>
                      <div className={`${styles.utilFill} ${styles[level]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className={styles.warehouseMeta}>
                      <span>{w.isActive ? 'Active' : 'Inactive'}</span>
                      <span>{pct}% utilized</span>
                    </div>
                  </div>
                );
              })}
              {warehouses.length === 0 && (
                <div className={styles.emptyState}>No warehouses configured</div>
              )}
            </div>
          </Card>

          <Card title="Activity Feed" noPadding>
            <ActivityFeed movements={movements} orders={orders} />
          </Card>
        </div>

        <div className={styles.contentGridFull}>
          <Card title="Inventory Value by Category">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fill: '#484F58', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#484F58', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#161B22', border: '1px solid #30363D', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#E6EDF3' }}
                    formatter={(value) => [fmtCurrency(Number(value)), 'Value']}
                  />
                  <Bar dataKey="value" fill="#00D4AA" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyState}>No category data available</div>
            )}
          </Card>

          <Card title="Purchase Order Pipeline" noPadding>
            <div className={styles.pipeline}>
              {(['Pending', 'Approved', 'Shipped', 'Received'] as PurchaseOrderStatus[]).map((status) => (
                <div key={status} className={`${styles.pipelineStage} ${styles[`stage${status}`]}`} onClick={() => navigate(`/purchase-orders?status=${status}`)}>
                  <div className={styles.pipelineCount}>{pipelineCounts[status] || 0}</div>
                  <div className={styles.pipelineLabel}>{status}</div>
                </div>
              ))}
            </div>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 3).map((o) => (
                  <tr key={o.id}>
                    <td className={`${styles.mono} ${styles.primaryText}`}>PO-{String(o.id).padStart(4, '0')}</td>
                    <td>{o.supplierName}</td>
                    <td>
                      <StatusBadge variant={o.status.toLowerCase() as 'pending' | 'approved' | 'shipped' | 'received'}>
                        {o.status}
                      </StatusBadge>
                    </td>
                    <td className={styles.mono}>{fmtCurrency(o.totalAmount)}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={4} className={styles.empty}>No purchase orders</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>

        {!loading && inventoryItems.length > 0 && categories.length > 0 && warehouses.length > 0 && (
          <div className={styles.heatmapSection}>
            <Card title="Inventory Heatmap">
              <InventoryHeatmap items={inventoryItems} categories={categories} warehouses={warehouses} onCellClick={() => navigate('/inventory')} />
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
