import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  BarChart3,
  Package,
  Tags,
  Warehouse,
  Users,
  ClipboardList,
  ArrowUpDown,
  Upload,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';
import { getInventory } from '../../api/inventory';
import type { InventoryItem } from '../../types';
import styles from './CommandPalette.module.css';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface ResultItem {
  id: string;
  section: string;
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  action: () => void;
}

const PAGE_ITEMS = [
  { id: 'nav-dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'nav-reports', label: 'Reports', icon: BarChart3, path: '/reports' },
  { id: 'nav-inventory', label: 'Items', icon: Package, path: '/inventory' },
  { id: 'nav-categories', label: 'Categories', icon: Tags, path: '/categories' },
  { id: 'nav-warehouses', label: 'Warehouses', icon: Warehouse, path: '/warehouses' },
  { id: 'nav-suppliers', label: 'Suppliers', icon: Users, path: '/suppliers' },
  { id: 'nav-purchase-orders', label: 'Purchase Orders', icon: ClipboardList, path: '/purchase-orders' },
  { id: 'nav-stock-movements', label: 'Stock Movements', icon: ArrowUpDown, path: '/stock-movements' },
  { id: 'nav-import', label: 'CSV Import', icon: Upload, path: '/import' },
];

const QUICK_ACTIONS = [
  { id: 'action-create-po', label: 'Create Purchase Order', icon: Plus, path: '/purchase-orders' },
  { id: 'action-import-csv', label: 'Import CSV', icon: FileSpreadsheet, path: '/import' },
  { id: 'action-reports', label: 'View Reports', icon: BarChart3, path: '/reports' },
];

const EMPTY_RESULTS: InventoryItem[] = [];

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inventoryResults, setInventoryResults] = useState<InventoryItem[]>(EMPTY_RESULTS);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset state synchronously when closing (React supports setState during render for derived state)
  if (prevOpen && !open) {
    setPrevOpen(open);
    setQuery('');
    setSelectedIndex(0);
    setInventoryResults(EMPTY_RESULTS);
  } else if (prevOpen !== open) {
    setPrevOpen(open);
  }

  // Open/close the dialog element
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Debounced inventory search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      // setState in setTimeout callback avoids the synchronous-in-effect lint rule
      const t = setTimeout(() => setInventoryResults(EMPTY_RESULTS), 0);
      return () => clearTimeout(t);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await getInventory(1, 5, query);
        setInventoryResults(result.items);
      } catch {
        setInventoryResults(EMPTY_RESULTS);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const buildResults = useCallback((): ResultItem[] => {
    const results: ResultItem[] = [];
    const q = query.toLowerCase();

    // Pages
    const filteredPages = q
      ? PAGE_ITEMS.filter((p) => p.label.toLowerCase().includes(q))
      : PAGE_ITEMS;

    for (const p of filteredPages) {
      results.push({
        id: p.id,
        section: 'Pages',
        icon: p.icon,
        label: p.label,
        action: () => {
          navigate(p.path);
          onClose();
        },
      });
    }

    // Quick Actions
    const filteredActions = q
      ? QUICK_ACTIONS.filter((a) => a.label.toLowerCase().includes(q))
      : QUICK_ACTIONS;

    for (const a of filteredActions) {
      results.push({
        id: a.id,
        section: 'Quick Actions',
        icon: a.icon,
        label: a.label,
        action: () => {
          navigate(a.path);
          onClose();
        },
      });
    }

    // Inventory items (from API search)
    for (const item of inventoryResults) {
      results.push({
        id: `inv-${item.id}`,
        section: 'Inventory',
        icon: Package,
        label: item.name,
        sublabel: item.sku,
        action: () => {
          navigate('/inventory');
          onClose();
        },
      });
    }

    return results;
  }, [query, inventoryResults, navigate, onClose]);

  const results = buildResults();

  // Reset selected index when query or results change
  const resetKey = useMemo(() => `${query}-${inventoryResults.length}`, [query, inventoryResults]);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setSelectedIndex(0);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length === 0) return;
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length === 0) return;
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      results[selectedIndex]?.action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Group results by section for rendering
  const sections: { title: string; items: (ResultItem & { globalIndex: number })[] }[] = [];
  let currentSection = '';
  results.forEach((item, idx) => {
    if (item.section !== currentSection) {
      currentSection = item.section;
      sections.push({ title: currentSection, items: [] });
    }
    sections[sections.length - 1].items.push({ ...item, globalIndex: idx });
  });

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className={styles.palette}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="text"
            placeholder="Search pages, actions, inventory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={styles.results}>
          {results.length === 0 ? (
            <div className={styles.empty}>No results found</div>
          ) : (
            sections.map((section) => (
              <div key={section.title}>
                <div className={styles.sectionTitle}>{section.title}</div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isSelected = item.globalIndex === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      className={`${styles.resultItem}${isSelected ? ` ${styles.resultItemSelected}` : ''}`}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(item.globalIndex)}
                    >
                      <Icon size={16} className={styles.resultIcon} />
                      <div className={styles.resultLabel}>
                        <div className={styles.resultName}>{item.label}</div>
                        {item.sublabel && (
                          <div className={styles.resultSub}>{item.sublabel}</div>
                        )}
                      </div>
                      {isSelected && (
                        <span className={styles.hint}>Enter</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <span><span className={styles.footerKey}>↑↓</span> navigate</span>
          <span><span className={styles.footerKey}>↵</span> select</span>
          <span><span className={styles.footerKey}>esc</span> close</span>
        </div>
      </div>
    </dialog>
  );
}
