import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react';
import styles from './ExportDropdown.module.css';

interface ExportDropdownProps {
  onExportCsv: () => void;
  onExportPdf: () => void;
}

export default function ExportDropdown({ onExportCsv, onExportPdf }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen(!open)}>
        <Download size={14} />
        Export
        <ChevronDown size={12} className={open ? styles.chevronOpen : ''} />
      </button>
      {open && (
        <div className={styles.menu}>
          <button className={styles.menuItem} onClick={() => { onExportCsv(); setOpen(false); }}>
            <FileSpreadsheet size={14} />
            Export CSV
          </button>
          <button className={styles.menuItem} onClick={() => { onExportPdf(); setOpen(false); }}>
            <FileText size={14} />
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
