import { useEffect, useRef, useState, useCallback } from 'react';
import {
  HubConnectionBuilder,
  HubConnection,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// In dev, use the Vite proxy (relative URL) to avoid CORS issues.
// In production, use the full API URL.
const HUB_URL = import.meta.env.DEV
  ? '/hubs/inventory'
  : `${import.meta.env.VITE_API_URL || 'http://localhost:7001'}/hubs/inventory`;

export interface UseSignalROptions {
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
}

export interface UseSignalRReturn {
  status: ConnectionStatus;
  /** Subscribe to a hub event. Returns an unsubscribe function. */
  on: (event: string, handler: (...args: unknown[]) => void) => () => void;
}

export function useSignalR(options: UseSignalROptions = {}): UseSignalRReturn {
  const { autoConnect = true } = options;
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const connectionRef = useRef<HubConnection | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!autoConnect) return;

    const conn = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('auth_token') || '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = conn;

    conn.onreconnecting(() => {
      if (mountedRef.current) setStatus('reconnecting');
    });

    conn.onreconnected(() => {
      if (mountedRef.current) setStatus('connected');
    });

    conn.onclose(() => {
      if (mountedRef.current) setStatus('disconnected');
    });

    conn.start()
      .then(() => {
        if (mountedRef.current) setStatus('connected');
      })
      .catch((err) => {
        console.warn('SignalR connection failed:', err);
        if (mountedRef.current) setStatus('disconnected');
      });

    return () => {
      mountedRef.current = false;
      if (conn.state !== HubConnectionState.Disconnected) {
        conn.stop();
      }
      connectionRef.current = null;
    };
  }, [autoConnect]);

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void): (() => void) => {
      const conn = connectionRef.current;
      if (!conn) return () => {};
      conn.on(event, handler);
      return () => conn.off(event, handler);
    },
    [],
  );

  return {
    status,
    on,
  };
}
