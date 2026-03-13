import { type ReactNode } from 'react';
import { useSignalR } from '../hooks/useSignalR';
import { useAuth } from '../hooks/useAuth';
import { SignalRContext } from './signalRContextDef';

export type { SignalRContextValue } from './signalRContextDef';

export function SignalRProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { status, on } = useSignalR({ autoConnect: isAuthenticated });

  return (
    <SignalRContext.Provider value={{ status, on }}>
      {children}
    </SignalRContext.Provider>
  );
}
