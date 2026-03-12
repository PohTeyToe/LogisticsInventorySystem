import type { ReactNode } from 'react';
import styles from './KpiCard.module.css';

type Variant = 'teal' | 'blue' | 'amber' | 'green';

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  variant: Variant;
  trend?: { direction: 'up' | 'down' | 'flat'; text: string };
  sparkline?: ReactNode;
  delay?: number;
  valueRef?: React.RefCallback<HTMLElement>;
}

export default function KpiCard({ label, value, icon, variant, trend, sparkline, delay = 0, valueRef }: KpiCardProps) {
  return (
    <div
      className={`${styles.card} ${styles[variant]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={styles.header}>
        <div className={styles.label}>{label}</div>
        <div className={styles.icon}>{icon}</div>
      </div>
      <div className={styles.value} ref={valueRef}>{value}</div>
      {sparkline && <div className={styles.sparkline}>{sparkline}</div>}
      {trend && (
        <div className={`${styles.trend} ${styles[trend.direction]}`}>
          {trend.direction === 'up' && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 15l7-7 7 7" /></svg>
          )}
          {trend.direction === 'down' && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 9l-7 7-7-7" /></svg>
          )}
          {trend.text}
        </div>
      )}
    </div>
  );
}
