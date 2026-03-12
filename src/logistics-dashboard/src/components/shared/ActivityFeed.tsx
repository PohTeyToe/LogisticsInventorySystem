import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, ClipboardList } from 'lucide-react';
import type { StockMovement, PurchaseOrder } from '../../types';
import styles from './ActivityFeed.module.css';

interface ActivityFeedProps {
  movements: StockMovement[];
  orders: PurchaseOrder[];
  maxItems?: number;
}

interface FeedItem {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'PO';
  title: string;
  detail: string;
  timestamp: string;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return 'Just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  if (diffHours < 48) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const iconMap = {
  IN: ArrowDownToLine,
  OUT: ArrowUpFromLine,
  ADJUSTMENT: RefreshCw,
  PO: ClipboardList,
} as const;

const colorMap = {
  IN: { item: styles.itemGreen, icon: styles.iconGreen },
  OUT: { item: styles.itemRed, icon: styles.iconRed },
  ADJUSTMENT: { item: styles.itemBlue, icon: styles.iconBlue },
  PO: { item: styles.itemTeal, icon: styles.iconTeal },
} as const;

export default function ActivityFeed({ movements, orders, maxItems = 20 }: ActivityFeedProps) {
  const items: FeedItem[] = [];

  for (const m of movements) {
    items.push({
      id: `mov-${m.id}`,
      type: m.type,
      title: `${m.type === 'IN' ? 'Stock In' : m.type === 'OUT' ? 'Stock Out' : 'Adjustment'}: ${m.itemName}`,
      detail: `${m.quantity} units — ${m.reason || m.itemSku}`,
      timestamp: m.timestamp,
    });
  }

  for (const o of orders) {
    items.push({
      id: `po-${o.id}`,
      type: 'PO',
      title: `PO #${o.id} — ${o.status}`,
      detail: `${o.supplierName} · $${o.totalAmount.toLocaleString()}`,
      timestamp: o.orderDate,
    });
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const visible = items.slice(0, maxItems);

  if (visible.length === 0) {
    return <div className={styles.empty}>No recent activity</div>;
  }

  return (
    <div className={styles.feed}>
      {visible.map((item) => {
        const Icon = iconMap[item.type];
        const colors = colorMap[item.type];
        return (
          <div key={item.id} className={`${styles.item} ${colors.item}`}>
            <div className={`${styles.iconCircle} ${colors.icon}`}>
              <Icon size={16} />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>{item.title}</div>
              <div className={styles.detail}>{item.detail}</div>
            </div>
            <div className={styles.timestamp}>{timeAgo(item.timestamp)}</div>
          </div>
        );
      })}
    </div>
  );
}
