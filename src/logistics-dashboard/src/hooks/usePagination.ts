import { useState, useMemo, useCallback } from 'react';

const STORAGE_KEY = 'logistics-page-size';
const DEFAULT_PAGE_SIZE = 20;

function getStoredPageSize(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const n = Number(stored);
      if (n > 0 && Number.isFinite(n)) return n;
    }
  } catch { /* ignore */ }
  return DEFAULT_PAGE_SIZE;
}

export interface UsePaginationReturn<T> {
  paginatedItems: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (p: number) => void;
  setPageSize: (size: number) => void;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}

export function usePagination<T>(items: T[]): UsePaginationReturn<T> {
  const [page, setPageRaw] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(getStoredPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp page when items/pageSize change
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) setPageRaw(safePage);

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const setPage = useCallback((p: number) => {
    setPageRaw(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeRaw(size);
    setPageRaw(1);
    try { localStorage.setItem(STORAGE_KEY, String(size)); } catch { /* ignore */ }
  }, []);

  return { paginatedItems, page: safePage, pageSize, totalPages, setPage, setPageSize, startIndex, endIndex, totalItems };
}
