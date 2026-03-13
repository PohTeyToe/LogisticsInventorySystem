import { createContext } from 'react';
import type { ConnectionStatus, UseSignalRReturn } from '../hooks/useSignalR';

export interface SignalRContextValue {
  status: ConnectionStatus;
  /** Subscribe to a hub event. Returns an unsubscribe function. */
  on: UseSignalRReturn['on'];
}

export const SignalRContext = createContext<SignalRContextValue>({
  status: 'disconnected',
  on: () => () => {},
});
