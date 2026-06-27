// Intercepting fetch calls for local mocking while AXiM API is finalized
let mockMachines = [
  { id: 'MACH-001', model: 'Vendo 721', status: 'ACTIVE', stock: 85, temp: 38.0, last_dex: new Date().toISOString(), location: 'HQ Lobby', type: 'FINANCED', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'MACH-002', model: 'Crane 167', status: 'REFILL', stock: 45, temp: 37.5, last_dex: new Date().toISOString(), location: 'Break Room A', type: 'OWNED', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

let mockInventory = [
  { id: 'monster-orig', name: 'Monster Energy Original', brand: 'Monster', case_cost: 42.48, unit_cogs: 1.77, retail_price: 4.00, margin: '55.75%', stock_level: 100, category: 'Energy' },
  { id: 'celsius-peach', name: 'Celsius Peach Vibe', brand: 'Celsius', case_cost: 17.98, unit_cogs: 1.50, retail_price: 3.50, margin: '57.14%', stock_level: 85, category: 'Energy' },
  { id: 'coke-35', name: 'Coca-Cola', brand: 'Coke', case_cost: 18.48, unit_cogs: 0.53, retail_price: 2.00, margin: '73.50%', stock_level: 120, category: 'Soda' }
];

export const mockFetch = async (url, options = {}) => {
  if (url === 'https://api.aximcapital.com/v1/internal/vending/machines') {
    if (options.method === 'POST') {
      const data = JSON.parse(options.body);
      const newMachine = {
        id: data.id || crypto.randomUUID(),
        model: data.model,
        status: data.status || 'ACTIVE',
        stock: data.stock || 100,
        temp: data.temp || 38.0,
        last_dex: new Date().toISOString(),
        location: data.location,
        type: data.type || 'FINANCED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockMachines.push(newMachine);
      return { ok: true, json: async () => newMachine };
    }
    return { ok: true, json: async () => mockMachines };
  }

  if (url.startsWith('https://api.aximcapital.com/v1/internal/vending/machines/')) {
    const id = url.split('/').pop();
    if (options.method === 'PUT' || options.method === 'PATCH') {
      const updateData = JSON.parse(options.body);
      const idx = mockMachines.findIndex(m => m.id === id);
      if (idx !== -1) {
        mockMachines[idx] = { ...mockMachines[idx], ...updateData, updated_at: new Date().toISOString() };
        return { ok: true, json: async () => mockMachines[idx] };
      }
      return { ok: false, status: 404, statusText: 'Not Found' };
    }
  }

  if (url === 'https://api.aximcapital.com/v1/internal/vending/inventory') {
    return { ok: true, json: async () => mockInventory };
  }

  if (url === 'https://api.aximcapital.com/v1/internal/vending/telemetry') {
    return { ok: true, json: async () => ({ success: true }) };
  }

  // Fallback to real fetch
  return fetch(url, options);
};

export const fetchAdapter = fetchAdapterUnified;

let mockSettings = [
  { id: 'SET-1', key: 'SCENARIO_A_FC', value: '1100', description: 'Garage + Truck Monthly Fixed Cost', updated_at: new Date().toISOString() },
  { id: 'SET-2', key: 'RESERVE_TARGET', value: '1800', description: 'Snowball Purchase Trigger Amount', updated_at: new Date().toISOString() },
  { id: 'SET-3', key: 'AVG_CM_PER_UNIT', value: '486.40', description: 'Average Contribution Margin per Machine', updated_at: new Date().toISOString() }
];

export const mockFetchSettings = async (url, options = {}) => {
  if (url === 'https://api.aximcapital.com/v1/internal/vending/settings') {
    if (options.method === 'POST') {
      const data = JSON.parse(options.body);
      const newSetting = {
        id: data.id || crypto.randomUUID(),
        key: data.key,
        value: data.value,
        description: data.description,
        updated_at: new Date().toISOString()
      };
      mockSettings.push(newSetting);
      return { ok: true, json: async () => newSetting };
    }
    return { ok: true, json: async () => mockSettings };
  }

  if (url.startsWith('https://api.aximcapital.com/v1/internal/vending/settings/')) {
    const idOrKey = url.split('/').pop();
    if (options.method === 'PUT' || options.method === 'PATCH') {
      const updateData = JSON.parse(options.body);
      const idx = mockSettings.findIndex(m => m.id === idOrKey || m.key === idOrKey);
      if (idx !== -1) {
        mockSettings[idx] = { ...mockSettings[idx], ...updateData, updated_at: new Date().toISOString() };
        return { ok: true, json: async () => mockSettings[idx] };
      }
      return { ok: false, status: 404, statusText: 'Not Found' };
    }
  }

  // Fallback to real fetch
  return fetch(url, options);
};

// We will export a unified fetch adapter that handles all endpoints
export const fetchAdapterUnified = async (url, options = {}) => {
    if (url.includes('/settings')) {
        return mockFetchSettings(url, options);
    }
    return mockFetch(url, options);
};
