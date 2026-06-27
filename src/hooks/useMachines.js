import { useContext } from 'react';
import { MachineContext } from '../context/MachineContext';

export function useMachines() {
  const context = useContext(MachineContext);
  if (!context) {
    throw new Error('useMachines must be used within a MachineProvider');
  }
  return context;
}
