import { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Package, DollarSign, AlertTriangle, CheckCircle, Eye, ShoppingCart, Lock, Unlock, RotateCcw } from 'lucide-react';
import { useSignalRContext } from '../contexts/SignalRContext';
import { ResponsiveGridLayout, type GridLayouts, type GridLayoutItem } from '../lib/gridLayout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
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
import { useToast } from '../hooks/useToastSimple';
import ToastContainer from '../components/shared/ToastContainer';
import {
  useDashboardValuation,
  useDashboardLowStock,
  useDashboardMovements,
  useDashboardWarehouses,
  useDashboardOrders,
  useDashboardInventory,
  useDashboardCategories,
} from '../hooks/queries/useDashboardQueries';
import { formatCurrency, formatCurrencyCounter as settingsFmtCounter } from '../hooks/useSettings';
import type { PurchaseOrderStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer as RechartsContainer } from 'recharts';
import styles from './Dashboard.module.css';

const LAYOUT_STORAGE_KEY = 'logistics-dashboard-layout';
const LOCK_STORAGE_KEY = 'logistics-dashboard-locked';

const DEFAULT_LAYOUTS: GridLayouts = {
  lg: [
    { i: 'kpi', x: 0, y: 0, w: 12, h: 3, minH: 3 },
    { i: 'movements', x: 0, y: 3, w: 5, h: 7, minW: 3, minH: 4 },
    { i: 'warehouses', x: 5, y: 3, w: 4, h: 7, minW: 2, minH: 4 },
    { i: 'activity', x: 9, y: 3, w: 3, h: 7, minW: 2, minH: 4 },
    { i: 'chart', x: 0, y: 10, w: 6, h: 7, minW: 3, minH: 5 },
    { i: 'pipeline', x: 6, y: 10, w: 6, h: 7, minW: 3, minH: 5 },
    { i: 'heatmap', x: 0, y: 17, w: 12, h: 6, minH: 4 },
  ],
  md: [
    { i: 'kpi', x: 0, y: 0, w: 12, h: 3, minH: 3 },
    { i: 'movements', x: 0, y: 3, w: 12, h: 7, minH: 4 },
    { i: 'warehouses', x: 0, y: 10, w: 6, h: 7, minW: 2, minH: 4 },
    { i: 'activity', x: 6, y: 10, w: 6, h: 7, minW: 2, minH: 4 },
    { i: 'chart', x: 0, y: 17, w: 6, h: 7, minW: 3, minH: 5 },
    { i: 'pipeline', x: 6, y: 17, w: 6, h: 7, minW: 3, minH: 5 },
    { i: 'heatmap', x: 0, y: 24, w: 12, h: 6, minH: 4 },
  ],
  sm: [
    { i: 'kpi', x: 0, y: 0, w: 12, h: 5, minH: 3 },
    { i: 'movements', x: 0, y: 5, w: 12, h: 7, minH: 4 },
    { i: 'warehouses', x: 0, y: 12, w: 12, h: 7, minH: 4 },
    { i: 'activity', x: 0, y: 19, w: 12, h: 7, minH: 4 },
    { i: 'chart', x: 0, y: 26, w: 12, h: 7, minH: 5 },
    { i: 'pipeline', x: 0, y: 33, w: 12, h: 7, minH: 5 },
    { i: 'heatmap', x: 0, y: 40, w: 12, h: 6, minH: 4 },
  ],
};

function loadLayouts(): GridLayouts {
  try {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return DEFAULT_LAYOUTS;
}

function loadLocked(): boolean {
  try {
    const stored = localStorage.getItem(LOCK_STORAGE_KEY);
    if (stored !== null) return stored === 'true';
  } catch { /* ignore */ }
  return true;
}

const fmt = (n: number) => n.toLocaleString();
const fmtCurrency = (n: number) => formatCurrency(n, 0);
const fmtCurrencyCounter = (n: number) => settingsFmtCounter(n);

export default function Dashboard() {
  const { onSearchClick } = useOutletContext<{ onSearchClick?: () => void }>();
  const navigate = useNavigate();
  const { toasts, addToast, dismiss } = useToast();
  const toastRef = useRef(addToast);
  toastRef.current = addToast;

  // Grid layout state
  const [layouts, setLayouts] = useState<GridLayouts>(loadLayouts);
  const [locked, setLocked] = useState(loadLocked);

  const handleLayoutChange = useCallback((_layout: GridLayoutItem[], allLayouts: GridLayouts) => {
    setLayouts(allLayouts);
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(allLayouts));
  }, []);

  const handleResetLayout = useCallback(() => {
    setLayouts(DEFAULT_LAYOUTS);
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
    addToast('Dashboard layout reset to default', 'success');
  }, [addToast]);

  const handleToggleLock = useCallback(() => {
    setLocked((prev) => {
      const next = !prev;
      localStorage.setItem(LOCK_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const { data: report, isLoading: reportLoading } = useDashboardValuation();
  const { data: lowStock = [], dataUpdatedAt: lowStockUpdatedAt } = useDashboardLowStock();
  const { data: movements = [] } = useDashboardMovements();
  const { data: warehouses = [] } = useDashboardWarehouses();
  const { data: orders = [] } = useDashboardOrders();
  const { data: inventoryData } = useDashboardInventory();
  const { data: categories = [] } = useDashboardCategories();

  const inventoryItems = inventoryData?.items ?? [];
  const loading = reportLoading;

  // SignalR: real-time updates — invalidate React Query caches on server events
  const { status: signalRStatus, on } = useSignalRContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubs = [
      on('InventoryUpdated', () => {
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      }),
      on('StockMovementCreated', () => {
        queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      }),
      on('PurchaseOrderUpdated', () => {
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      }),
      on('LowStockAlert', (_data: unknown) => {
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        toastRef.current('New low stock alert detected', 'warning');
      }),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [on, queryClient]);

  // Track low stock count changes for toast notifications
  const prevLowStockCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevLowStockCountRef.current !== null && lowStock.length > prevLowStockCountRef.current) {
      toastRef.current(
        `${lowStock.length - prevLowStockCountRef.current} new low stock alert${lowStock.length - prevLowStockCountRef.current > 1 ? 's' : ''} detected`,
        'warning',
      );
    }
    prevLowStockCountRef.current = lowStock.length;
  }, [lowStock.length, lowStockUpdatedAt]);

  const lastUpdated = lowStockUpdatedAt ? new Date(lowStockUpdatedAt) : null;

  // Stable formatters for animated counters (avoid new refs each render)
  const fmtItems = useCallback((n: number) => fmt(Math.round(n)), []);
  const fmtValue = useCallback((n: number) => fmtCurrencyCounter(n), []);
  const fmtCount = useCallback((n: number) => String(Math.round(n)), []);
  const fmtPercent = useCallback((n: number) => `${n.toFixed(1)}%`, []);

  // Animated counters
  const totalItems = useAnimatedCounter({
    target: report?.totalItems || 0,
    formatter: fmtItems,
    enabled: !loading,
  });
  const totalValue = useAnimatedCounter({
    target: report?.totalValue || 0,
    formatter: fmtValue,
    enabled: !loading,
  });
  const lowStockCounter = useAnimatedCounter({
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

  const fillRate = useAnimatedCounter({
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

  const connectionIndicator = (
    <span className={styles.connectionStatus} title={`Real-time: ${signalRStatus}`}>
      <span className={`${styles.connectionDot} ${styles[signalRStatus]}`} />
      {signalRStatus === 'connected' ? 'Live' : signalRStatus === 'reconnecting' ? 'Reconnecting' : signalRStatus === 'connecting' ? 'Connecting' : 'Offline'}
    </span>
  );

  return (
    <>
      <Header title="Operations Dashboard" showLive subtitle={lastUpdatedStr} onSearchClick={onSearchClick} notificationSlot={notificationSlot} />
      <div className={styles.connectionBar}>{connectionIndicator}</div>
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

        {!loading && lowStock.length > 0 && (
          <Card title="Low Stock Actions" count={lowStock.length} noPadding>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Item</th>
                  <th>Warehouse</th>
                  <th>Current Qty</th>
                  <th>Reorder Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.slice(0, 5).map((item) => (
                  <tr key={item.itemId}>
                    <td className={styles.mono}>{item.sku}</td>
                    <td className={styles.primaryText}>{item.name}</td>
                    <td>{item.warehouseName}</td>
                    <td className={styles.mono}>
                      <StatusBadge variant="out">{item.currentQuantity}</StatusBadge>
                    </td>
                    <td className={styles.mono}>{item.reorderLevel}</td>
                    <td>
                      <div className={styles.alertActions}>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/inventory?search=${encodeURIComponent(item.sku)}`)}>
                          <Eye size={13} /> View
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => navigate(`/purchase-orders?create=1&itemName=${encodeURIComponent(item.name)}&itemSku=${encodeURIComponent(item.sku)}&quantity=${item.reorderLevel - item.currentQuantity}`)}>
                          <ShoppingCart size={13} /> Create PO
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <div className={styles.gridControls}>
          <Button variant="ghost" size="sm" onClick={handleToggleLock} title={locked ? 'Unlock layout to drag and resize widgets' : 'Lock layout'}>
            {locked ? <Lock size={14} /> : <Unlock size={14} />}
            {locked ? 'Unlock Layout' : 'Lock Layout'}
          </Button>
          {!locked && (
            <Button variant="ghost" size="sm" onClick={handleResetLayout}>
              <RotateCcw size={14} /> Reset Layout
            </Button>
          )}
        </div>

        <ResponsiveGridLayout
          className={`${styles.gridLayout} ${locked ? styles.gridLocked : ''}`}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 0 }}
          cols={{ lg: 12, md: 12, sm: 12 }}
          rowHeight={30}
          isDraggable={!locked}
          isResizable={!locked}
          onLayoutChange={handleLayoutChange}
          draggableHandle={`.${styles.widgetDragHandle}`}
          compactType="vertical"
          margin={[16, 16]}
        >
          <div key="kpi" className={styles.gridWidget}>
            <div className={styles.widgetDragHandle} />
            {loading ? <SkeletonKpiRow /> : (
              <div className={styles.kpiRow}>
                <KpiCard label="Total Items" value={totalItems.value} valueRef={totalItems.ref} icon={<Package size={18} />} variant="teal" sparkline={<Sparkline data={sparkItems} color="var(--chart-color-1)" filled />} delay={50} />
                <KpiCard label="Inventory Value" value={totalValue.value} valueRef={totalValue.ref} icon={<DollarSign size={18} />} variant="blue" sparkline={<Sparkline data={sparkValue} color="var(--chart-color-2)" filled />} delay={100} />
                <KpiCard label="Low Stock Alerts" value={lowStockCounter.value} valueRef={lowStockCounter.ref} icon={<AlertTriangle size={18} />} variant="amber" sparkline={<Sparkline data={sparkAlerts} color="var(--chart-color-3)" filled />} delay={150} />
                <KpiCard label="Order Fill Rate" value={fillRate.value} valueRef={fillRate.ref} icon={<CheckCircle size={18} />} variant="green" sparkline={<Sparkline data={sparkFillRate} color="var(--chart-color-4)" filled />} delay={200} />
              </div>
            )}
          </div>

          <div key="movements" className={styles.gridWidget}>
            <div className={styles.widgetDragHandle} />
            {loading ? (
              <Card title="Recent Stock Movements" count="24h" noPadding><SkeletonTable rows={5} cols={6} /></Card>
            ) : (
              <Card title="Recent Stock Movements" count="24h" noPadding>
                <table className={styles.dataTable}>
                  <thead><tr><th>Time</th><th>Item</th><th>SKU</th><th>Type</th><th>Qty</th><th>Reason</th></tr></thead>
                  <tbody>
                    {movements.length === 0 && <tr><td colSpan={6} className={styles.empty}>No recent movements</td></tr>}
                    {movements.map((m) => (
                      <tr key={m.id}>
                        <td className={styles.mono}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className={styles.primaryText}>{m.itemName}</td>
                        <td className={styles.mono}>{m.itemSku}</td>
                        <td><StatusBadge variant={m.type === 'IN' ? 'in' : m.type === 'OUT' ? 'out' : 'adjustment'}>{m.type}</StatusBadge></td>
                        <td className={styles.mono}>{m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : '±'}{m.quantity}</td>
                        <td>{m.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>

          <div key="warehouses" className={styles.gridWidget}>
            <div className={styles.widgetDragHandle} />
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
                {warehouses.length === 0 && <div className={styles.emptyState}>No warehouses configured</div>}
              </div>
            </Card>
          </div>

          <div key="activity" className={styles.gridWidget}>
            <div className={styles.widgetDragHandle} />
            <Card title="Activity Feed" noPadding><ActivityFeed movements={movements} orders={orders} /></Card>
          </div>

          <div key="chart" className={styles.gridWidget}>
            <div className={styles.widgetDragHandle} />
            <Card title="Inventory Value by Category">
              {chartData.length > 0 ? (
                <RechartsContainer width="100%" height={180}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: 'var(--text-primary)' }} formatter={(value) => [fmtCurrency(Number(value)), 'Value']} />
                    <Bar dataKey="value" fill="var(--chart-color-1)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </RechartsContainer>
              ) : <div className={styles.emptyState}>No category data available</div>}
            </Card>
          </div>

          <div key="pipeline" className={styles.gridWidget}>
            <div className={styles.widgetDragHandle} />
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
                <thead><tr><th>PO Number</th><th>Supplier</th><th>Status</th><th>Total</th></tr></thead>
                <tbody>
                  {orders.slice(0, 3).map((o) => (
                    <tr key={o.id}>
                      <td className={`${styles.mono} ${styles.primaryText}`}>PO-{String(o.id).padStart(4, '0')}</td>
                      <td>{o.supplierName}</td>
                      <td><StatusBadge variant={o.status.toLowerCase() as 'pending' | 'approved' | 'shipped' | 'received'}>{o.status}</StatusBadge></td>
                      <td className={styles.mono}>{fmtCurrency(o.totalAmount)}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={4} className={styles.empty}>No purchase orders</td></tr>}
                </tbody>
              </table>
            </Card>
          </div>

          <div key="heatmap" className={styles.gridWidget}>
            <div className={styles.widgetDragHandle} />
            {!loading && inventoryItems.length > 0 && categories.length > 0 && warehouses.length > 0 ? (
              <Card title="Inventory Heatmap">
                <InventoryHeatmap items={inventoryItems} categories={categories} warehouses={warehouses} onCellClick={() => navigate('/inventory')} />
              </Card>
            ) : (
              <Card title="Inventory Heatmap"><div className={styles.emptyState}>Loading heatmap data...</div></Card>
            )}
          </div>
        </ResponsiveGridLayout>
      </main>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
