import { useEffect, useRef, useId } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const Icon = variant === 'danger' ? Trash2 : AlertTriangle;
  const iconStyle = variant === 'danger' ? styles.iconDanger : styles.iconWarning;
  const confirmStyle = variant === 'danger' ? styles.confirmBtnDanger : styles.confirmBtnWarning;

  return (
    <dialog
      ref={dialogRef}
      className={styles.overlay}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onCancel();
      }}
    >
      <div className={styles.card}>
        <div className={`${styles.iconCircle} ${iconStyle}`}>
          <Icon size={24} />
        </div>
        <div className={styles.title} id={titleId}>{title}</div>
        <div className={styles.message}>{message}</div>
        <div className={styles.actions}>
          <button ref={cancelRef} className={styles.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={confirmStyle} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
