import { machineService } from '../services/machineService';
import { planogramService } from '../services/planogramService';

class TelemetryEmitter {
  constructor() {
    this.listeners = {
      'heartbeat': [],
      'transaction': [],
      'alert': [],
      'raw': []
    };
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
    if (event !== 'raw' && this.listeners['raw']) {
      this.listeners['raw'].forEach(cb => cb({ event, ...data }));
    }
  }
}

export const telemetryEmitter = new TelemetryEmitter();
let intervalId = null;
let currentSpeed = 5000; // default 5 seconds

const generateHMAC = (payload) => {
  return 'hmac_sha256_' + btoa(JSON.stringify(payload)).substring(0, 32);
};

export const startTelemetrySimulator = (speed = 5000) => {
  if (intervalId) return;
  currentSpeed = speed;

  intervalId = setInterval(async () => {
    try {
      const machines = await machineService.getAll();
      if (machines.length === 0) return;

      const now = Date.now();
      const needsRestock = machines.find(m =>
        m.status === 'ONYX_DISPATCHED' &&
        m.dispatchedAt &&
        (now - m.dispatchedAt) > 35000
      );

      if (needsRestock) {
        planogramService.restockAll();
        const payload = {
          NayaxTransactionId: crypto.randomUUID(),
          MachineId: needsRestock.id,
          Type: 'RESTOCK',
          Timestamp: new Date().toISOString()
        };
        telemetryEmitter.emit('raw', payload);
        return;
      }

      const randomIndex = Math.floor(Math.random() * machines.length);
      const machine = machines[randomIndex];

      const eventType = Math.random();

      if (eventType < 0.4) {
        // VEND TRANSACTION
        const availableSelections = planogramService.getAvailableSelections();
        if (availableSelections.length > 0) {
          const selectionId = availableSelections[Math.floor(Math.random() * availableSelections.length)];
          const quantity = 1;
          const vendResult = planogramService.recordVend(selectionId, quantity);

          const newStock = Math.max(0, machine.stock - quantity);
          const paymentTypes = ['MDB Cashless', 'Cash', 'NFC'];
          const statuses = ['Success', 'Success', 'Success', 'Jam', 'Drop Sensor Fail'];
          const paymentType = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
          const status = statuses[Math.floor(Math.random() * statuses.length)];

          const payload = {
            MachineId: machine.id,
            Type: 'VEND',
            Item: vendResult ? vendResult.product : 'Simulated Item',
            SelectionId: selectionId,
            Amount: 2.50,
            Quantity: quantity,
            NewStock: newStock,
            PaymentType: paymentType,
            VendStatus: status,
            NayaxTransactionId: crypto.randomUUID(),
            Timestamp: new Date().toISOString()
          };

          telemetryEmitter.emit('transaction', payload);
          telemetryEmitter.emit('raw', payload);

          if (newStock < 30) {
             telemetryEmitter.emit('alert', {
                MachineId: machine.id,
                AlertType: 'LOW_STOCK',
                Message: `Low stock threshold breached.`,
                Timestamp: new Date().toISOString()
             });
          }
        }
      } else if (eventType < 0.8) {
        // HEARTBEAT
        const newTemp = parseFloat((machine.temp + (Math.random() * 2 - 1)).toFixed(1));
        const rssi = Math.floor(Math.random() * 40) - 90; // -90 to -50 dBm
        const payload = {
          MachineId: machine.id,
          Type: 'TEMP_READING',
          NewTemp: newTemp,
          RSSI: rssi,
          Timestamp: new Date().toISOString()
        };
        telemetryEmitter.emit('heartbeat', payload);
        machineService.sendHeartbeat({
          machineId: machine.id,
          timestamp: payload.Timestamp,
          internalTemp: newTemp,
          powerStatus: 'OK',
          inventoryDelta: 0,
          errorCodes: []
        }).catch(err => console.error('Failed to send heartbeat via machineService', err));
        telemetryEmitter.emit('raw', payload);

        if (newTemp > 45) {
           telemetryEmitter.emit('alert', {
              MachineId: machine.id,
              AlertType: 'HIGH_TEMP',
              Message: `Temperature out of spec (> 45°F).`,
              Timestamp: new Date().toISOString(),
              Temp: newTemp
           });
        }
      } else {
         // Random general alert to simulate issues
         if (Math.random() > 0.8) {
            telemetryEmitter.emit('alert', {
               MachineId: machine.id,
               AlertType: 'MDB_FAULT',
               Message: 'Coin Changer Offline',
               Timestamp: new Date().toISOString()
            });
         }
      }

    } catch (err) {
      console.error('Telemetry simulator error', err);
    }
  }, currentSpeed);
};

export const stopTelemetrySimulator = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
