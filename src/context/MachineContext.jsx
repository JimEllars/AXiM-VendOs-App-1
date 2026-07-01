import React, { createContext, useState, useEffect, useCallback } from 'react';
import { machineService } from '../services/machineService';
import { startTelemetrySimulator, stopTelemetrySimulator } from '../utils/telemetrySimulator';
import { ledgerService } from '../services/ledgerService';
import { inventoryService } from '../services/inventoryService';

export const MachineContext = createContext(null);

export const MachineProvider = ({ children }) => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pulseId, setPulseId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);


  const fetchMachines = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await machineService.getAll();
      setMachines(data);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMachines();

    // Live polling if not using mock API
    if (import.meta.env.VITE_USE_MOCK_API === "false") {
      const interval = setInterval(() => {
        fetchMachines(true); // silent fetch
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [fetchMachines]);


  useEffect(() => {
    startTelemetrySimulator((payload) => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 1500);

      setMachines(prev => {
        const updatedId = payload.MachineId;
        const oldMachine = prev.find(m => m.id === updatedId);
        if (!oldMachine) return prev;

        const updateData = { last_dex: payload.Timestamp };

        if (payload.Type === 'RESTOCK') {
          const restockAmount = 100 - oldMachine.stock;
          updateData.stock = 100;
          updateData.temp = 38.0;
          updateData.status = 'ACTIVE';
          updateData.dispatchedAt = null;

          if (restockAmount > 0) {
            inventoryService.deplete(restockAmount).catch(err => console.error('Failed to deplete inventory', err));
          }
        } else if (payload.Type === 'VEND') {
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

        if (payload.Type !== 'RESTOCK') {
          if (newStock < 30 || newTemp > 40) {
            updateData.status = 'ONYX_DISPATCHED';
            if (oldMachine.status !== 'ONYX_DISPATCHED') {
              updateData.dispatchedAt = Date.now();
            }
          } else if (newStock < 60) {
            updateData.status = 'REFILL';
          } else {
            updateData.status = 'ACTIVE';
          }
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

  const value = { machines, loading, error, refresh: fetchMachines, pulseId, isSyncing };

  return (
    <MachineContext.Provider value={value}>
      {children}
    </MachineContext.Provider>
  );
};
