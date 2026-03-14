import { useEffect, useCallback, type ReactNode } from 'react';
import { X } from 'lucide-react';
import styles from './DetailDrawer.module.css';

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  width?: number;
}

export default function DetailDrawer({ open, onClose, children, title, width = 480 }: DetailDrawerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className={`${styles.wrapper} ${styles.open}`}>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.drawer} style={{ width }}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </aside>
    </div>
  );
}
