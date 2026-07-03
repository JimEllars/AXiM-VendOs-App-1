import { fetchAdapterUnified } from './mocks/adapter';
let planogramData = [
  { id: 'A1', product: 'Monster Original', stock: 12, capacity: 12, status: 'optimal' },
  { id: 'A2', product: 'Celsius Peach', stock: 4, capacity: 12, status: 'warning' },
  { id: 'A3', product: 'Red Bull', stock: 0, capacity: 12, status: 'critical' },
  { id: 'B1', product: 'Gatorade Blue', stock: 8, capacity: 15, status: 'optimal' },
  { id: 'B2', product: 'Alani Nu Breeze', stock: 14, capacity: 15, status: 'optimal' },
  { id: 'B3', product: 'Smart Water', stock: 2, capacity: 15, status: 'critical' },
];

let listeners = [];

const calculateStatus = (stock, capacity) => {
  const ratio = stock / capacity;
  if (ratio <= 0.2) return 'critical';
  if (ratio <= 0.5) return 'warning';
  return 'optimal';
};

export const planogramService = {
  subscribe(listener) {
    listeners.push(listener);
    // Immediately send current state
    listener([...planogramData]);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  async getPlanogramData(machineId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    return [...planogramData];
  },

  getAvailableSelections() {
    return planogramData.filter(item => item.stock > 0).map(item => item.id);
  },

  restockAll() {
    planogramData = planogramData.map(item => ({
      ...item,
      stock: item.capacity,
      status: 'optimal'
    }));
    listeners.forEach(listener => listener([...planogramData]));
  },

  recordVend(selectionId, quantity = 1) {
    let itemToVend = null;

    planogramData = planogramData.map(item => {
      if (item.id === selectionId) {
        itemToVend = { ...item };
        const newStock = Math.max(0, item.stock - quantity);
        return {
          ...item,
          stock: newStock,
          status: calculateStatus(newStock, item.capacity)
        };
      }
      return item;
    });

    if (itemToVend) {
      listeners.forEach(listener => listener([...planogramData]));
    }

    return itemToVend;
  },

  async updateBulk(audits) {
    planogramData = planogramData.map(item => {
      const audit = audits.find(a => a.selectionId === item.id);
      if (audit) {
        return {
          ...item,
          stock: audit.stock,
          status: calculateStatus(audit.stock, item.capacity)
        };
      }
      return item;
    });

    listeners.forEach(listener => listener([...planogramData]));
  },


  async updateItem(id, updates) {
    planogramData = planogramData.map(item => {
      if (item.id === id) {
        return { ...item, ...updates, status: calculateStatus(updates.stock !== undefined ? updates.stock : item.stock, item.capacity) };
      }
      return item;
    });

    // Explicitly send PUT request to the live edge API
    const useMock = import.meta.env.VITE_USE_MOCK_API !== 'false';
    if (!useMock) {
      try {
        const baseUrl = import.meta.env.VITE_AXIM_API_URL || 'http://localhost:8787';
        // Build payload matching the DB schema
        const payload = planogramData.map(item => ({
          machine_id: updates.machineId || 'MACH-001', // Ideally passed, using default if not available
          coil_id: item.id,
          product_id: item.product,
          current_stock: item.stock,
          capacity: item.capacity,
          status: item.status
        }));

        fetchAdapterUnified(baseUrl + '/v1/internal/vending/planogram', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).catch(err => console.error('Failed to sync planogram data:', err));
      } catch (err) {
        console.error('Error triggering planogram sync', err);
      }
    }

    listeners.forEach(listener => listener([...planogramData]));
  }
};
