import { machineService } from '../services/machineService';

let intervalId = null;

const generateHMAC = (payload) => {
  // Simulating an HMAC generation for realism
  return 'hmac_sha256_' + btoa(JSON.stringify(payload)).substring(0, 32);
};

export const startTelemetrySimulator = (callback) => {
  if (intervalId) return;

  intervalId = setInterval(async () => {
    try {
      const machines = await machineService.getAll();
      if (machines.length === 0) return;

      // Pick a random machine
      const randomIndex = Math.floor(Math.random() * machines.length);
      const machine = machines[randomIndex];

      // Simulate a vend (stock decrease) or temp change
      const isVend = Math.random() > 0.5;

      const payload = {
        NayaxTransactionId: crypto.randomUUID(),
        MachineId: machine.id,
        IsApproved: true,
        Timestamp: new Date().toISOString()
      };

      if (isVend) {
         payload.Type = 'VEND';
         payload.Item = 'Simulated Item';
         payload.Amount = 2.50;
         payload.Quantity = Math.floor(Math.random() * 3 + 1);
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