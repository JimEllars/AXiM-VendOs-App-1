import React, { createContext, useState, useEffect, useCallback } from 'react';
import { machineService } from '../services/machineService';
import { startTelemetrySimulator, stopTelemetrySimulator } from '../utils/telemetrySimulator';
import { ledgerService } from '../services/ledgerService';

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
    startTelemetrySimulator((payload) => {
      setMachines(prev => {
        const updatedId = payload.MachineId;
        const oldMachine = prev.find(m => m.id === updatedId);
        if (!oldMachine) return prev;

        const updateData = { last_dex: payload.Timestamp };

        if (payload.Type === 'VEND') {
          updateData.stock = payload.NewStock;

          ledgerService.recordMicroTransaction({
            machineId: updatedId,
            item: payload.Item,
            selectionId: payload.SelectionId,
            quantity: payload.Quantity,
            amount: payload.Amount,
            transactionId: payload.NayaxTransactionId,
            timestamp: payload.Timestamp
          });
        } else if (payload.Type === 'TEMP_READING') {
          updateData.temp = payload.NewTemp;
        }

        const newStock = updateData.stock !== undefined ? updateData.stock : oldMachine.stock;
        const newTemp = updateData.temp !== undefined ? updateData.temp : oldMachine.temp;

        if (newStock < 30 || newTemp > 40) {
          updateData.status = 'ONYX_DISPATCHED';
        } else if (newStock < 60) {
          updateData.status = 'REFILL';
        } else {
          updateData.status = 'ACTIVE';
        }

        // Apply update to mock backend service so subsequent fetches are correct
        machineService.update(updatedId, updateData).catch(err => console.error('Failed to update machine service', err));

        return prev.map(m => m.id === updatedId ? { ...m, ...updateData } : m);
      });

      setPulseId(payload.MachineId);
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
