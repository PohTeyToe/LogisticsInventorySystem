import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react';
import styles from './ExportDropdown.module.css';

interface ExportDropdownProps {
  onExportCsv: () => void;
  onExportPdf: () => void;
}

const ITEMS = ['csv', 'pdf'] as const;

export default function ExportDropdown({ onExportCsv, onExportPdf }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (open && focusIndex >= 0) {
      menuItemRefs.current[focusIndex]?.focus();
    }
  }, [open, focusIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusIndex((i) => (i + 1) % ITEMS.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusIndex((i) => (i - 1 + ITEMS.length) % ITEMS.length);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setFocusIndex(-1);
        break;
    }
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    setFocusIndex(next ? 0 : -1);
  };

  const select = (action: () => void) => {
    action();
    setOpen(false);
    setFocusIndex(-1);
  };

  return (
    <div className={styles.wrap} ref={ref} onKeyDown={handleKeyDown}>
      <button className={styles.trigger} onClick={toggle} aria-expanded={open} aria-haspopup="true">
        <Download size={14} />
        Export
        <ChevronDown size={12} className={open ? styles.chevronOpen : ''} />
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <button ref={(el) => { menuItemRefs.current[0] = el; }} className={styles.menuItem} role="menuitem" onClick={() => select(onExportCsv)}>
            <FileSpreadsheet size={14} />
            Export CSV
          </button>
          <button ref={(el) => { menuItemRefs.current[1] = el; }} className={styles.menuItem} role="menuitem" onClick={() => select(onExportPdf)}>
            <FileText size={14} />
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
