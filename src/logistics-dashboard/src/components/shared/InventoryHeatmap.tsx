import { Fragment, useMemo } from 'react';
import type { InventoryItem, Category, Warehouse } from '../../types';
import styles from './InventoryHeatmap.module.css';

interface CellData {
  totalQty: number;
  itemCount: number;
  avgReorderLevel: number;
}

interface InventoryHeatmapProps {
  items: InventoryItem[];
  categories: Category[];
  warehouses: Warehouse[];
  onCellClick?: (categoryId: number, warehouseId: number) => void;
}

function getCellColor(cell: CellData | undefined): string {
  if (!cell || cell.itemCount === 0) return 'var(--bg-elevated)';
  const ratio = cell.totalQty / (cell.avgReorderLevel * cell.itemCount);
  if (ratio > 3) return 'rgba(63, 185, 80, 0.7)';
  if (ratio >= 1.5) return 'rgba(0, 212, 170, 0.5)';
  if (ratio >= 0.5) return 'rgba(245, 158, 11, 0.5)';
  return 'rgba(248, 81, 73, 0.6)';
}

export default function InventoryHeatmap({
  items,
  categories,
  warehouses,
  onCellClick,
}: InventoryHeatmapProps) {
  const matrix = useMemo(() => {
    const map = new Map<string, CellData>();

    for (const item of items) {
      const key = `${item.categoryId}-${item.warehouseId}`;
      const existing = map.get(key);
      if (existing) {
        existing.totalQty += item.quantity;
        existing.itemCount += 1;
        existing.avgReorderLevel =
          (existing.avgReorderLevel * (existing.itemCount - 1) + item.reorderLevel) /
          existing.itemCount;
      } else {
        map.set(key, {
          totalQty: item.quantity,
          itemCount: 1,
          avgReorderLevel: item.reorderLevel,
        });
      }
    }

    return map;
  }, [items]);

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `120px repeat(${warehouses.length}, 1fr)`,
        }}
      >
        {/* Top-left empty corner */}
        <div className={styles.cornerCell} />

        {/* Warehouse header cells */}
        {warehouses.map((wh) => (
          <div key={`header-${wh.id}`} className={styles.headerCell}>
            <span>{wh.name}</span>
          </div>
        ))}

        {/* Category rows */}
        {categories.map((cat) => (
          <Fragment key={`row-${cat.id}`}>
            <div className={styles.rowLabel}>
              {cat.name}
            </div>
            {warehouses.map((wh) => {
              const cell = matrix.get(`${cat.id}-${wh.id}`);
              const tooltipText = cell
                ? `${cat.name} × ${wh.name}: ${cell.itemCount} items, ${cell.totalQty} total qty, ${Math.round(cell.avgReorderLevel)} avg reorder level`
                : `${cat.name} × ${wh.name}: empty`;

              return (
                <div
                  key={`cell-${cat.id}-${wh.id}`}
                  className={styles.cell}
                  style={{ backgroundColor: getCellColor(cell), cursor: onCellClick ? 'pointer' : 'default' }}
                  title={tooltipText}
                  onClick={() => onCellClick?.(cat.id, wh.id)}
                >
                  {cell ? cell.totalQty : ''}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Low</span>
        <div className={styles.legendBar}>
          <div
            className={styles.legendSegment}
            style={{ backgroundColor: 'rgba(248, 81, 73, 0.6)' }}
          />
          <div
            className={styles.legendSegment}
            style={{ backgroundColor: 'rgba(245, 158, 11, 0.5)' }}
          />
          <div
            className={styles.legendSegment}
            style={{ backgroundColor: 'rgba(0, 212, 170, 0.5)' }}
          />
          <div
            className={styles.legendSegment}
            style={{ backgroundColor: 'rgba(63, 185, 80, 0.7)' }}
          />
        </div>
        <span className={styles.legendLabel}>High</span>
      </div>
    </div>
  );
}
