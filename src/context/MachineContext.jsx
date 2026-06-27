import React, { createContext, useState, useEffect, useCallback } from 'react';
import { machineService } from '../services/machineService';
import { startTelemetrySimulator, stopTelemetrySimulator } from '../utils/telemetrySimulator';

export const MachineContext = createContext(null);

export const MachineProvider = ({ children }) => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pulseId, setPulseId] = useState(null);

  const fetchMachines = useCallback(async () => {
    try {
      setLoading(true);
      const data = await machineService.getAll();
      setMachines(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  useEffect(() => {
    startTelemetrySimulator((updatedId, updateData) => {
      setMachines(prev => prev.map(m => m.id === updatedId ? { ...m, ...updateData } : m));
      setPulseId(updatedId);
      setTimeout(() => setPulseId(null), 2000);
    });

    return () => stopTelemetrySimulator();
  }, []);

  const value = { machines, loading, error, refresh: fetchMachines, pulseId };

  return (
    <MachineContext.Provider value={value}>
      {children}
    </MachineContext.Provider>
  );
};
