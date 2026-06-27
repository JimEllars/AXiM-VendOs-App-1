import { fetchAdapter } from './mocks/adapter';

const API_BASE = 'https://api.aximcapital.com/v1/internal/vending';

export const settingsService = {
  async getAll() {
    const res = await fetchAdapter(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async getByKey(key) {
    const all = await this.getAll();
    return all.find(s => s.key === key);
  },

  async updateValue(key, value) {
    const all = await this.getAll();
    const existing = all.find(s => s.key === key);
    
    if (existing) {
      const res = await fetchAdapter(`${API_BASE}/settings/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
      if (!res.ok) throw new Error('Failed to update setting');
      return res.json();
    } else {
      const res = await fetchAdapter(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value,
          description: 'System parameter'
        })
      });
      if (!res.ok) throw new Error('Failed to create setting');
      return res.json();
    }
  },

  async bootstrap() {
    // Handled by mock data or backend initialization
    console.warn('bootstrap() is deprecated with new API structure');
  }
};
