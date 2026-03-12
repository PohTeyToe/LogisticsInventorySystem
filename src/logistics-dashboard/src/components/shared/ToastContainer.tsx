import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import type { useToast } from '../../hooks/useToastSimple';
import type { Toast, ToastVariant } from '../../hooks/useToastSimple';
import styles from './ToastContainer.module.css';

const variantIcon: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
};

const variantIconClass: Record<ToastVariant, string> = {
  success: styles.iconSuccess,
  warning: styles.iconWarning,
  danger: styles.iconDanger,
  info: styles.iconInfo,
};

interface ToastContainerProps {
  toasts: Toast[];
  dismiss: ReturnType<typeof useToast>['dismiss'];
}

export default function ToastContainer({ toasts, dismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => {
        const Icon = variantIcon[toast.variant];
        return (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.variant]}${toast.exiting ? ` ${styles.exiting}` : ''}`}
          >
            <Icon size={18} className={variantIconClass[toast.variant]} />
            <span className={styles.message}>{toast.message}</span>
            <button
              className={styles.close}
              onClick={() => dismiss(toast.id)}
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
