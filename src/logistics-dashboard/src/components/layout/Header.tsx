import { useNavigate } from 'react-router-dom';
import { Settings, Search, Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  showLive?: boolean;
  subtitle?: string;
  onSearchClick?: () => void;
  onMenuClick?: () => void;
  notificationSlot?: ReactNode;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(
  (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform
);

export default function Header({ title, showLive = false, subtitle, onSearchClick, onMenuClick, notificationSlot }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {onMenuClick && (
          <button className={`${styles.btn} ${styles.menuBtn}`} title="Open menu" onClick={onMenuClick}>
            <Menu size={18} />
          </button>
        )}
        <h1 className={styles.title}>{title}</h1>
        {showLive && (
          <div className={styles.liveIndicator}>
            <div className={styles.liveDot} />
            LIVE
          </div>
        )}
        {subtitle && (
          <span className={styles.subtitle}>{subtitle}</span>
        )}
      </div>
      <div className={styles.right}>
        {onSearchClick ? (
          <button className={styles.searchWrap} onClick={onSearchClick} type="button">
            <Search size={14} className={styles.searchIcon} />
            <span className={styles.searchPlaceholder}>Search items, SKUs, orders...</span>
            <kbd className={styles.kbd}>{isMac ? '\u2318K' : 'Ctrl+K'}</kbd>
          </button>
        ) : (
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.search}
              placeholder="Search items, SKUs, orders..."
            />
          </div>
        )}
        {notificationSlot}
        <button className={styles.btn} title="Settings" onClick={() => navigate('/settings')}>
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
