import { useState, useCallback, useMemo } from 'react';

export interface BulkSelectReturn {
  selectedIds: Set<number>;
  toggleSelect: (id: number) => void;
  toggleSelectAll: (allIds: number[]) => void;
  clearSelection: () => void;
  isAllSelected: (allIds: number[]) => boolean;
  isSelected: (id: number) => boolean;
  count: number;
}

export function useBulkSelect(): BulkSelectReturn {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((allIds: number[]) => {
    setSelectedIds((prev) => {
      const allSelected = allIds.length > 0 && allIds.every((id) => prev.has(id));
      if (allSelected) {
        return new Set();
      }
      return new Set(allIds);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useCallback(
    (allIds: number[]) => allIds.length > 0 && allIds.every((id) => selectedIds.has(id)),
    [selectedIds],
  );

  const isSelected = useCallback(
    (id: number) => selectedIds.has(id),
    [selectedIds],
  );

  const count = useMemo(() => selectedIds.size, [selectedIds]);

  return { selectedIds, toggleSelect, toggleSelectAll, clearSelection, isAllSelected, isSelected, count };
}
