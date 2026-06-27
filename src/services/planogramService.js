export const planogramService = {
  async getPlanogramData(machineId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    return [
      { id: 'A1', product: 'Monster Original', stock: 12, capacity: 12, status: 'optimal' },
      { id: 'A2', product: 'Celsius Peach', stock: 4, capacity: 12, status: 'warning' },
      { id: 'A3', product: 'Red Bull', stock: 0, capacity: 12, status: 'critical' },
      { id: 'B1', product: 'Gatorade Blue', stock: 8, capacity: 15, status: 'optimal' },
      { id: 'B2', product: 'Alani Nu Breeze', stock: 14, capacity: 15, status: 'optimal' },
      { id: 'B3', product: 'Smart Water', stock: 2, capacity: 15, status: 'critical' },
    ];
  }
};
