import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import CommandPalette from '../shared/CommandPalette';
import { getLowStockReport } from '../../api/reports';
import client from '../../api/client';
import styles from './Layout.module.css';

export default function Layout() {
  const { isOpen, open, close } = useCommandPalette();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [apiConnected, setApiConnected] = useState(false);
  const [apiLatency, setApiLatency] = useState<number | undefined>(undefined);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    getLowStockReport()
      .then((alerts) => setLowStockCount(alerts.length))
      .catch(() => setLowStockCount(0));

    const start = performance.now();
    client.get('/api/report/valuation')
      .then(() => {
        setApiLatency(Math.round(performance.now() - start));
        setApiConnected(true);
      })
      .catch(() => {
        setApiConnected(false);
        setApiLatency(undefined);
      });
  }, []);

  return (
    <div className={styles.layout}>
      <a href="#main-content" className={styles.skipNav}>Skip to content</a>
      <Sidebar
        apiConnected={apiConnected}
        apiLatency={apiLatency}
        lowStockCount={lowStockCount}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className={styles.mainArea} id="main-content">
        <Outlet context={{ onSearchClick: open, onMenuClick: () => setMobileNavOpen(true) }} />
        <CommandPalette open={isOpen} onClose={close} />
      </div>
    </div>
  );
}
