import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState<K extends string> {
  key: K | null;
  direction: SortDirection;
}

export interface UseTableSortReturn<T, K extends string> {
  sortedItems: T[];
  sortState: SortState<K>;
  toggleSort: (key: K) => void;
  getSortIndicator: (key: K) => string;
}

export function useTableSort<T, K extends string>(
  items: T[],
  accessor: (item: T, key: K) => string | number | null | undefined
): UseTableSortReturn<T, K> {
  const [sortState, setSortState] = useState<SortState<K>>({ key: null, direction: null });

  const toggleSort = (key: K) => {
    setSortState((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: null };
    });
  };

  const sortedItems = useMemo(() => {
    if (!sortState.key || !sortState.direction) return items;
    const key = sortState.key;
    const dir = sortState.direction === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      const aVal = accessor(a, key);
      const bVal = accessor(b, key);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
      return String(aVal).localeCompare(String(bVal)) * dir;
    });
  }, [items, sortState, accessor]);

  const getSortIndicator = (key: K): string => {
    if (sortState.key !== key) return '';
    return sortState.direction === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  return { sortedItems, sortState, toggleSort, getSortIndicator };
}
