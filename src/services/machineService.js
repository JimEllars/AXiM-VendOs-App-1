import { fetchAdapter } from './mocks/adapter';

const API_BASE = 'https://api.aximcapital.com/v1/internal/vending';

export const machineService = {
  async getAll() {
    const res = await fetchAdapter(`${API_BASE}/machines`);
    if (!res.ok) throw new Error('Failed to fetch machines');
    return res.json();
  },

  async create(data) {
    const res = await fetchAdapter(`${API_BASE}/machines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create machine');
    return res.json();
  },

  async update(id, data) {
    const res = await fetchAdapter(`${API_BASE}/machines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update machine');
    return res.json();
  }
};
