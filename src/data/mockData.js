export const summaryMetrics = {
  totalCashYield: 11672.64,
  activeRouteTemp: 38.5,
  fleetCount: 24,
  monthlyOverhead: 1100.00,
};

export const machines = [
  { id: 'DFW-EJR-2607-042', status: 'ACTIVE', stock: 94, model: 'Naturals2Go N2G4000', temp: 38.2, lastDEX: '2m ago' },
  { id: 'VCO-7212-2509-12', status: 'REFILL', stock: 42, model: 'Vendo 721', temp: 39.1, lastDEX: '5m ago' },
  { id: 'ETX-N2G-2608-015', status: 'CRITICAL', stock: 18, model: 'USI 3606 Evoke', temp: 45.5, lastDEX: '1m ago' },
  { id: 'DFW-AVS-2601-088', status: 'ACTIVE', stock: 88, model: 'Royal Vendors 660', temp: 37.8, lastDEX: '12m ago' },
];

export const fleetEconomics = {
  months: ['Mo 03', 'Mo 06', 'Mo 12', 'Mo 18', 'Mo 24'],
  finance: {
    machines: [4, 7, 13, 19, 25],
    profit: [1296, 2593, 5186, 7779, 10372]
  },
  hybrid: {
    machines: [3, 6, 12, 18, 24],
    profit: [864, 2408, 5496, 8584, 11672]
  }
};

export const planogramData = [
  { id: 'A1', product: 'Monster Original', stock: 12, capacity: 12, status: 'optimal' },
  { id: 'A2', product: 'Celsius Peach', stock: 4, capacity: 12, status: 'warning' },
  { id: 'A3', product: 'Red Bull', stock: 0, capacity: 12, status: 'critical' },
  { id: 'B1', product: 'Gatorade Blue', stock: 8, capacity: 15, status: 'optimal' },
  { id: 'B2', product: 'Alani Nu Breeze', stock: 14, capacity: 15, status: 'optimal' },
  { id: 'B3', product: 'Smart Water', stock: 2, capacity: 15, status: 'critical' },
];