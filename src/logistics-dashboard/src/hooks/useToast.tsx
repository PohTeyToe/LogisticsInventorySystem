import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "warning" | "danger" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting: boolean;
}

interface ToastContextValue {
  toast: (message: string, variant: ToastVariant, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const startExiting = useCallback(
    (id: string) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      );
      const removeTimer = setTimeout(() => removeToast(id), 300);
      timersRef.current.set(`${id}-remove`, removeTimer);
    },
    [removeToast],
  );

  const toast = useCallback(
    (message: string, variant: ToastVariant, duration: number = 4000) => {
      const id = `toast-${++toastIdCounter}`;
      const newToast: Toast = { id, message, variant, exiting: false };

      setToasts((prev) => [...prev, newToast]);

      // Start exit animation 300ms before the total duration ends
      const exitDelay = Math.max(duration - 300, 0);
      const exitTimer = setTimeout(() => startExiting(id), exitDelay);
      timersRef.current.set(id, exitTimer);
    },
    [startExiting],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Render toast container for consumers to style/portal as needed */}
      {toasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            pointerEvents: "none",
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              data-toast-id={t.id}
              data-toast-variant={t.variant}
              data-toast-exiting={t.exiting}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                color: "#fff",
                fontSize: 14,
                pointerEvents: "auto",
                opacity: t.exiting ? 0 : 1,
                transition: "opacity 300ms ease",
                backgroundColor:
                  t.variant === "success"
                    ? "#16a34a"
                    : t.variant === "warning"
                      ? "#d97706"
                      : t.variant === "danger"
                        ? "#dc2626"
                        : "#2563eb",
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
