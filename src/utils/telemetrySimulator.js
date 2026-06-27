import { machineService } from '../services/machineService';

let intervalId = null;

export const startTelemetrySimulator = (callback) => {
  if (intervalId) return;

  intervalId = setInterval(async () => {
    try {
      const machines = await machineService.getAll();
      if (machines.length === 0) return;

      // Pick a random machine
      const randomIndex = Math.floor(Math.random() * machines.length);
      const machine = machines[randomIndex];

      // Simulate a stock decrease or temp change
      const isStockChange = Math.random() > 0.5;

      const updateData = {};
      if (isStockChange) {
         updateData.stock = Math.max(0, machine.stock - Math.floor(Math.random() * 3 + 1));
      } else {
         updateData.temp = parseFloat((machine.temp + (Math.random() * 2 - 1)).toFixed(1));
      }

      updateData.last_dex = new Date().toISOString();

      if (updateData.stock < 30) updateData.status = 'CRITICAL';
      else if (updateData.stock < 60) updateData.status = 'REFILL';
      else updateData.status = 'ACTIVE';

      await machineService.update(machine.id, updateData);

      // Notify UI
      if (callback) {
        callback(machine.id, updateData);
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
