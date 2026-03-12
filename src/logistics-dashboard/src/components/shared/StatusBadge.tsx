import styles from './StatusBadge.module.css';

type BadgeVariant = 'in' | 'out' | 'adjustment' | 'pending' | 'approved' | 'shipped' | 'received' | 'cancelled' | 'success' | 'warning' | 'danger';

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

export default function StatusBadge({ variant, children }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  );
}
