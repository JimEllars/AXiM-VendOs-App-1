import { fetchAdapter } from './mocks/adapter';

const API_BASE = 'https://api.aximcapital.com/v1/internal/vending';

export const inventoryService = {
  async getAll() {
    const res = await fetchAdapter(`${API_BASE}/inventory`);
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
  },

  async seed() {
    // Deprecated for now with mock adapter/real API
    console.warn('seed() is deprecated with new API structure');
  }
};
