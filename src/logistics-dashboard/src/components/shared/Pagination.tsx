import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../../pages/CrudPage.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function Pagination({
  page, totalPages, pageSize, totalItems, startIndex, endIndex,
  onPageChange, onPageSizeChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  return (
    <div className={styles.pagination}>
      <span>
        {startIndex + 1}–{endIndex} of {totalItems}
        {' | '}
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className={styles.pageSizeSelect}
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      </span>
      <div className={styles.pageButtons}>
        <button
          className={styles.actionBtn}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1]) > 1) acc.push('ellipsis');
            acc.push(p);
            return acc;
          }, [])
          .map((p, idx) =>
            p === 'ellipsis' ? (
              <span key={`e${idx}`} className={styles.pageEllipsis}>...</span>
            ) : (
              <button
                key={p}
                className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            )
          )}
        <button
          className={styles.actionBtn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
