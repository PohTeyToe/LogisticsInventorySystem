import { useContext } from 'react';
import { SignalRContext, type SignalRContextValue } from '../contexts/signalRContextDef';

export function useSignalRContext(): SignalRContextValue {
  return useContext(SignalRContext);
}
