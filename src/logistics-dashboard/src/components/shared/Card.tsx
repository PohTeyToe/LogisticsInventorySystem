import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  title: string;
  count?: string | number;
  actions?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
}

export default function Card({ title, count, actions, children, noPadding = false }: CardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.title}>
          {title}
          {count !== undefined && <span className={styles.count}>{count}</span>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={noPadding ? styles.bodyFlush : styles.body}>
        {children}
      </div>
    </div>
  );
}
