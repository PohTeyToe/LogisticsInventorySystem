import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './KeyboardShortcuts.module.css';

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(
  (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform
);

const mod = isMac ? '\u2318' : 'Ctrl';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const groups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: `${mod}+K`, description: 'Open command palette' },
      { keys: '?', description: 'Toggle this help dialog' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: 'Escape', description: 'Close modal / drawer / dialog' },
    ],
  },
  {
    title: 'Sidebar Pages',
    shortcuts: [
      { keys: 'G then D', description: 'Go to Dashboard' },
      { keys: 'G then I', description: 'Go to Inventory' },
      { keys: 'G then R', description: 'Go to Reports' },
      { keys: 'G then A', description: 'Go to Analytics' },
      { keys: 'G then W', description: 'Go to Warehouses' },
      { keys: 'G then S', description: 'Go to Settings' },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcuts({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onClose}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Keyboard Shortcuts</h2>
          <button className={styles.close} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>
          {groups.map((group) => (
            <div key={group.title} className={styles.group}>
              <h3 className={styles.groupTitle}>{group.title}</h3>
              <div className={styles.list}>
                {group.shortcuts.map((s) => (
                  <div key={s.keys} className={styles.row}>
                    <span className={styles.description}>{s.description}</span>
                    <kbd className={styles.kbd}>{s.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </dialog>
  );
}
