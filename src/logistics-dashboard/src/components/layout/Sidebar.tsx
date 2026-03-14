import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, Package, Tags, Warehouse as WarehouseIcon,
  Users, ClipboardList, ArrowUpDown, Upload, ChevronDown, TrendingUp, Settings, History, LogOut
} from 'lucide-react';
import { getTenantId } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import ConfirmDialog from '../shared/ConfirmDialog';
import styles from './Sidebar.module.css';

const navGroups = [
  {
    title: 'Overview',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/reports', icon: BarChart3, label: 'Reports' },
      { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { to: '/inventory', icon: Package, label: 'Items' },
      { to: '/categories', icon: Tags, label: 'Categories' },
      { to: '/warehouses', icon: WarehouseIcon, label: 'Warehouses' },
    ],
  },
  {
    title: 'Procurement',
    items: [
      { to: '/suppliers', icon: Users, label: 'Suppliers' },
      { to: '/purchase-orders', icon: ClipboardList, label: 'Purchase Orders' },
      { to: '/stock-movements', icon: ArrowUpDown, label: 'Stock Movements' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { to: '/import', icon: Upload, label: 'CSV Import' },
      { to: '/audit-log', icon: History, label: 'Audit Log' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

interface SidebarProps {
  lowStockCount?: number;
  apiLatency?: number;
  apiConnected?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ lowStockCount, apiLatency, apiConnected = true, mobileOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const badgeCount = lowStockCount && lowStockCount > 0 ? lowStockCount : undefined;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const sidebarContent = (
    <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`} aria-label="Main navigation">
      <div className={styles.brand}>
        <div className={styles.brandIcon}>LP</div>
        <div className={styles.brandText}>
          Logistics<span>Pulse</span>
        </div>
      </div>

      <div className={styles.tenantSwitcher}>
        <div className={styles.tenantLabel}>Organization</div>
        <div className={styles.tenantName}>
          Tenant {getTenantId()}
          <ChevronDown size={14} />
        </div>
      </div>

      <nav className={styles.nav} aria-label="Site navigation">
        {navGroups.map((group) => (
          <div key={group.title} className={styles.navGroup}>
            <div className={styles.navGroupTitle}>{group.title}</div>
            {group.items.map((item) => {
              const itemBadge = item.to === '/inventory' ? badgeCount : undefined;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.active : ''}`
                  }
                  onClick={onClose}
                >
                  <item.icon size={18} className={styles.navIcon} />
                  {item.label}
                  {itemBadge !== undefined && itemBadge > 0 && (
                    <span className={styles.navBadge} aria-label={`${itemBadge} low stock items`}>{itemBadge}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        {user && (
          <div className={styles.userSection}>
            <div className={styles.userAvatar}>
              {(user.fullName || user.email).charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.fullName || user.email}</div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
            <button className={styles.logoutBtn} onClick={() => setLogoutConfirmOpen(true)} title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        )}
        <div className={styles.systemStatus}>
          <div className={`${styles.statusDot} ${apiConnected ? styles.connected : styles.disconnected}`} />
          {apiConnected ? `API Connected` : 'Disconnected'}
          {apiLatency !== undefined && ` · ${apiLatency}ms`}
        </div>
      </div>
    </aside>
  );

  if (mobileOpen) {
    return (
      <>
        <div className={styles.backdrop} onClick={onClose} role="presentation" />
        {sidebarContent}
        <ConfirmDialog
          open={logoutConfirmOpen}
          title="Sign Out"
          message="Are you sure you want to sign out?"
          confirmLabel="Sign Out"
          variant="warning"
          onConfirm={() => { setLogoutConfirmOpen(false); handleLogout(); }}
          onCancel={() => setLogoutConfirmOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      {sidebarContent}
      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        variant="warning"
        onConfirm={() => { setLogoutConfirmOpen(false); handleLogout(); }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </>
  );
}
