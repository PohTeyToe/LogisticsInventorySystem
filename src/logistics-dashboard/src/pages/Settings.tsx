import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Monitor, RefreshCw, Wifi, WifiOff, Info } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/shared/Card';
import StatusBadge from '../components/shared/StatusBadge';
import { getTenantId } from '../api/client';
import useTheme from '../hooks/useTheme';
import styles from './Settings.module.css';

type RefreshInterval = '15' | '30' | '60' | 'off';
type PageSize = '10' | '20' | '50' | '100';
type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD';

function getStored<T extends string>(key: string, fallback: T): T {
  const val = localStorage.getItem(key);
  return (val as T) || fallback;
}

export default function Settings() {
  const { theme, preference, setTheme } = useTheme();

  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(() =>
    getStored('logistics-refresh-interval', '30')
  );
  const [pageSize, setPageSize] = useState<PageSize>(() =>
    getStored('logistics-page-size', '20')
  );
  const [currency, setCurrency] = useState<Currency>(() =>
    getStored('logistics-currency', 'USD')
  );
  const [lowStockAlerts, setLowStockAlerts] = useState(() =>
    localStorage.getItem('logistics-low-stock-alerts') !== 'false'
  );
  const [browserNotifs, setBrowserNotifs] = useState(() =>
    localStorage.getItem('logistics-browser-notifs') === 'true'
  );
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '(dev proxy)' : 'http://localhost:7001');
  const tenantId = getTenantId();

  // Persist settings
  useEffect(() => {
    localStorage.setItem('logistics-refresh-interval', refreshInterval);
  }, [refreshInterval]);

  useEffect(() => {
    localStorage.setItem('logistics-page-size', pageSize);
  }, [pageSize]);

  useEffect(() => {
    localStorage.setItem('logistics-currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('logistics-low-stock-alerts', String(lowStockAlerts));
  }, [lowStockAlerts]);

  useEffect(() => {
    localStorage.setItem('logistics-browser-notifs', String(browserNotifs));
  }, [browserNotifs]);

  // Check API connectivity
  const checkApi = useCallback(async () => {
    setApiStatus('checking');
    try {
      const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:7001');
      const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
      setApiStatus(res.ok ? 'online' : 'offline');
    } catch {
      setApiStatus('offline');
    }
  }, []);

  useEffect(() => { checkApi(); }, [checkApi]);

  // Browser notifications permission
  const handleBrowserNotifs = (enabled: boolean) => {
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        setBrowserNotifs(perm === 'granted');
      });
    } else {
      setBrowserNotifs(enabled);
    }
  };

  return (
    <>
      <Header title="Settings" subtitle="Preferences & configuration" />
      <div className={styles.content}>
        <div className={styles.grid}>

          {/* Appearance */}
          <Card title="Appearance">
            <div className={styles.section}>
              <label className={styles.label}>Theme</label>
              <div className={styles.segmented}>
                {([
                  { value: 'dark', icon: <Moon size={14} />, label: 'Dark' },
                  { value: 'light', icon: <Sun size={14} />, label: 'Light' },
                  { value: 'system', icon: <Monitor size={14} />, label: 'System' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    className={`${styles.segBtn} ${preference === opt.value ? styles.segActive : ''}`}
                    onClick={() => setTheme(opt.value)}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className={styles.preview}>
                <div className={styles.previewCard} data-preview={theme}>
                  <div className={styles.previewHeader}>
                    <div className={styles.previewDot} style={{ background: 'var(--status-danger)' }} />
                    <div className={styles.previewDot} style={{ background: 'var(--amber)' }} />
                    <div className={styles.previewDot} style={{ background: 'var(--status-success)' }} />
                  </div>
                  <div className={styles.previewBody}>
                    <div className={styles.previewSidebar}>
                      <div className={styles.previewLine} style={{ width: '80%' }} />
                      <div className={styles.previewLine} style={{ width: '60%', opacity: 0.5 }} />
                      <div className={styles.previewLine} style={{ width: '70%', opacity: 0.5 }} />
                    </div>
                    <div className={styles.previewMain}>
                      <div className={styles.previewLine} style={{ width: '40%', height: 6 }} />
                      <div className={styles.previewKpis}>
                        <div className={styles.previewKpi} />
                        <div className={styles.previewKpi} />
                        <div className={styles.previewKpi} />
                      </div>
                    </div>
                  </div>
                </div>
                <span className={styles.previewLabel}>
                  Current: {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </span>
              </div>
            </div>
          </Card>

          {/* Data & Display */}
          <Card title="Data & Display">
            <div className={styles.section}>
              <label className={styles.label}>Auto-refresh interval</label>
              <div className={styles.segmented}>
                {(['15', '30', '60', 'off'] as const).map((val) => (
                  <button
                    key={val}
                    className={`${styles.segBtn} ${refreshInterval === val ? styles.segActive : ''}`}
                    onClick={() => setRefreshInterval(val)}
                  >
                    {val === 'off' ? 'Off' : `${val}s`}
                  </button>
                ))}
              </div>

              <label className={styles.label}>Items per page</label>
              <div className={styles.segmented}>
                {(['10', '20', '50', '100'] as const).map((val) => (
                  <button
                    key={val}
                    className={`${styles.segBtn} ${pageSize === val ? styles.segActive : ''}`}
                    onClick={() => setPageSize(val)}
                  >
                    {val}
                  </button>
                ))}
              </div>

              <label className={styles.label}>Currency format</label>
              <div className={styles.segmented}>
                {(['USD', 'EUR', 'GBP', 'CAD'] as const).map((val) => (
                  <button
                    key={val}
                    className={`${styles.segBtn} ${currency === val ? styles.segActive : ''}`}
                    onClick={() => setCurrency(val)}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card title="Notifications">
            <div className={styles.section}>
              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleLabel}>Low stock alerts on dashboard</span>
                  <span className={styles.toggleDesc}>Show warning banner when items fall below reorder point</span>
                </div>
                <button
                  className={`${styles.toggle} ${lowStockAlerts ? styles.toggleOn : ''}`}
                  onClick={() => setLowStockAlerts(!lowStockAlerts)}
                  role="switch"
                  aria-checked={lowStockAlerts}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>

              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleLabel}>Browser notifications</span>
                  <span className={styles.toggleDesc}>Get notified about critical stock events</span>
                </div>
                <button
                  className={`${styles.toggle} ${browserNotifs ? styles.toggleOn : ''}`}
                  onClick={() => handleBrowserNotifs(!browserNotifs)}
                  role="switch"
                  aria-checked={browserNotifs}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>
            </div>
          </Card>

          {/* API Configuration */}
          <Card title="API Configuration">
            <div className={styles.section}>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>API URL</span>
                <code className={styles.configValue}>{apiUrl}</code>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Tenant</span>
                <code className={styles.configValue}>Tenant {tenantId}</code>
              </div>
              <div className={styles.configRow}>
                <span className={styles.configLabel}>Connectivity</span>
                <div className={styles.statusWrap}>
                  {apiStatus === 'checking' && (
                    <span className={styles.statusChecking}>
                      <RefreshCw size={12} className={styles.spin} />
                      Checking...
                    </span>
                  )}
                  {apiStatus === 'online' && (
                    <StatusBadge variant="success">
                      <Wifi size={11} style={{ marginRight: 4, verticalAlign: -1 }} />
                      Connected
                    </StatusBadge>
                  )}
                  {apiStatus === 'offline' && (
                    <StatusBadge variant="danger">
                      <WifiOff size={11} style={{ marginRight: 4, verticalAlign: -1 }} />
                      Unreachable
                    </StatusBadge>
                  )}
                  <button className={styles.retryBtn} onClick={checkApi} title="Retry">
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* About */}
          <Card title="About">
            <div className={styles.section}>
              <div className={styles.aboutGrid}>
                <Info size={32} className={styles.aboutIcon} />
                <div>
                  <h3 className={styles.aboutTitle}>Logistics Inventory System</h3>
                  <div className={styles.aboutMeta}>
                    <div className={styles.configRow}>
                      <span className={styles.configLabel}>Version</span>
                      <code className={styles.configValue}>1.0.0</code>
                    </div>
                    <div className={styles.configRow}>
                      <span className={styles.configLabel}>Frontend</span>
                      <span className={styles.configValue}>React 19 + TypeScript + Vite</span>
                    </div>
                    <div className={styles.configRow}>
                      <span className={styles.configLabel}>Backend</span>
                      <span className={styles.configValue}>ASP.NET Core 8 + Entity Framework</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </>
  );
}
