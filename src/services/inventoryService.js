import { fetchAdapter } from './mocks/adapter';

const API_BASE = 'https://api.aximcapital.com/v1/internal/vending';

let listeners = [];

export const inventoryService = {
  subscribe(listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  async getAll() {
    const res = await fetchAdapter(`${API_BASE}/inventory`);
    if (!res.ok) throw new Error('Failed to fetch inventory');
    const data = await res.json();
    this.notify(data);
    return data;
  },

  async deplete(quantity) {
    const res = await fetchAdapter(`${API_BASE}/inventory/deplete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity })
    });
    if (!res.ok) throw new Error('Failed to deplete inventory');
    const data = await res.json();
    this.notify(data);
    return data;
  },

  async updateItem(id, data) {
    const res = await fetchAdapter(`${API_BASE}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update inventory item');
    const updatedData = await res.json();
    this.notify(updatedData);
    return updatedData;
  },

  notify(data) {
    listeners.forEach(listener => listener(data));
  },

  async seed() {
    // Deprecated for now with mock adapter/real API
    console.warn('seed() is deprecated with new API structure');
  }
};