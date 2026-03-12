import { Trash2, X } from 'lucide-react';
import styles from './BulkActionBar.module.css';

interface BulkActionBarProps {
  count: number;
  onDelete: () => void;
  onClear: () => void;
}

export default function BulkActionBar({ count, onDelete, onClear }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className={styles.bar}>
      <span className={styles.count}>{count} item{count !== 1 ? 's' : ''} selected</span>
      <div className={styles.actions}>
        <button className={styles.deleteBtn} onClick={onDelete}>
          <Trash2 size={14} />
          Delete Selected
        </button>
        <button className={styles.clearBtn} onClick={onClear}>
          <X size={14} />
          Deselect All
        </button>
      </div>
    </div>
  );
}
