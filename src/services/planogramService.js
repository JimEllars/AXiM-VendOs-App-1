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
    listener(planogramData);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  async getPlanogramData(machineId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    return [...planogramData];
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
      listeners.forEach(listener => listener(planogramData));
    }

    return itemToVend;
  }
};
