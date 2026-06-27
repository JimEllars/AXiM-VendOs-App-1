import { machineService } from '../services/machineService';
import { planogramService } from '../services/planogramService';

let intervalId = null;

const generateHMAC = (payload) => {
  // Simulating an HMAC generation for realism
  return 'hmac_sha256_' + btoa(JSON.stringify(payload)).substring(0, 32);
};

const selectionIds = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];

export const startTelemetrySimulator = (callback) => {
  if (intervalId) return;

  intervalId = setInterval(async () => {
    try {
      const machines = await machineService.getAll();
      if (machines.length === 0) return;

      // Restock Agent Logic
      const now = Date.now();
      const needsRestock = machines.find(m =>
        m.status === 'ONYX_DISPATCHED' &&
        m.dispatchedAt &&
        (now - m.dispatchedAt) > 35000 // 35 seconds
      );

      if (needsRestock) {
        planogramService.restockAll();
        const payload = {
          NayaxTransactionId: crypto.randomUUID(),
          MachineId: needsRestock.id,
          Type: 'RESTOCK',
          Timestamp: new Date().toISOString()
        };
        const hmac = generateHMAC(payload);
        console.log(`[Telemetry Sim] Webhook Dispatched (RESTOCK) | HMAC: ${hmac}`, payload);
        if (callback) callback(payload);
        return;
      }

      // Pick a random machine
      const randomIndex = Math.floor(Math.random() * machines.length);
      const machine = machines[randomIndex];

      // Simulate a vend (stock decrease) or temp change
      let isVend = Math.random() > 0.5;

      const availableSelections = planogramService.getAvailableSelections();
      if (availableSelections.length === 0) {
        isVend = false; // Force temp reading if nothing to vend
      }

      const payload = {
        NayaxTransactionId: crypto.randomUUID(),
        MachineId: machine.id,
        IsApproved: true,
        Timestamp: new Date().toISOString()
      };

      if (isVend) {
         const selectionId = availableSelections[Math.floor(Math.random() * availableSelections.length)];
         const quantity = 1; // keep it 1 to match planogram decrements nicely, or could be random

         const vendResult = planogramService.recordVend(selectionId, quantity);

         payload.Type = 'VEND';
         payload.Item = vendResult ? vendResult.product : 'Simulated Item';
         payload.SelectionId = selectionId;
         payload.Amount = 2.50;
         payload.Quantity = quantity;
         payload.NewStock = Math.max(0, machine.stock - payload.Quantity);
      } else {
         payload.Type = 'TEMP_READING';
         payload.NewTemp = parseFloat((machine.temp + (Math.random() * 2 - 1)).toFixed(1));
      }

      const hmac = generateHMAC(payload);
      console.log(`[Telemetry Sim] Webhook Dispatched | HMAC: ${hmac}`, payload);

      // Notify UI via callback with raw payload
      if (callback) {
        callback(payload);
      }

    } catch (err) {
      console.error('Telemetry simulator error', err);
    }
  }, 10000); // 10 seconds for more visible action during testing, normally 30-60s
};

export const stopTelemetrySimulator = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
