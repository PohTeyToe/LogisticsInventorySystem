import { useRef, useEffect, useState } from 'react';
import { Bell, AlertTriangle, AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { timeAgo } from '../../utils/timeAgo';
import styles from './NotificationCenter.module.css';

export interface Notification {
  id: string;
  type: 'warning' | 'danger' | 'success' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
}

const iconMap = {
  warning: AlertTriangle,
  danger: AlertCircle,
  success: CheckCircle,
  info: Info,
} as const;

const iconStyleMap = {
  warning: styles.iconWarning,
  danger: styles.iconDanger,
  success: styles.iconSuccess,
  info: styles.iconInfo,
} as const;

export default function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={styles.bellButton}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className={`${styles.badge} ${styles.badgePulsing}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown} role="dialog" aria-label="Notifications">
          <div className={styles.header}>
            <span className={styles.headerTitle}>Notifications</span>
            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={onMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>No notifications</div>
            ) : (
              notifications.map((notif) => {
                const Icon = iconMap[notif.type];
                return (
                  <div
                    key={notif.id}
                    className={styles.notificationItem}
                    onClick={() => !notif.read && onMarkRead(notif.id)}
                  >
                    <div className={`${styles.iconCircle} ${iconStyleMap[notif.type]}`}>
                      <Icon size={16} />
                    </div>
                    <div className={styles.content}>
                      <div className={styles.titleRow}>
                        <span className={styles.notifTitle}>{notif.title}</span>
                        {!notif.read && <span className={styles.unreadDot} />}
                      </div>
                      <div className={styles.message}>{notif.message}</div>
                    </div>
                    <div className={styles.meta}>
                      <span className={styles.timestamp}>{timeAgo(notif.timestamp)}</span>
                      <button
                        className={styles.dismissBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismiss(notif.id);
                        }}
                        aria-label="Dismiss notification"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
