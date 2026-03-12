import { createContext, useContext, type ReactNode } from 'react';
import { useSignalR, type ConnectionStatus, type UseSignalRReturn } from '../hooks/useSignalR';

interface SignalRContextValue {
  status: ConnectionStatus;
  /** Subscribe to a hub event. Returns an unsubscribe function. */
  on: UseSignalRReturn['on'];
}

const SignalRContext = createContext<SignalRContextValue>({
  status: 'disconnected',
  on: () => () => {},
});

export function SignalRProvider({ children }: { children: ReactNode }) {
  const { status, on } = useSignalR({ autoConnect: true });

  return (
    <SignalRContext.Provider value={{ status, on }}>
      {children}
    </SignalRContext.Provider>
  );
}

export function useSignalRContext(): SignalRContextValue {
  return useContext(SignalRContext);
}
