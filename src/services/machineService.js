import { mockFetch } from './mocks/adapter';

const API_BASE = 'https://api.aximcapital.com/v1/internal/vending';

const safeFetch = async (endpoint, options = {}) => {
  const useMock = import.meta.env.VITE_USE_MOCK_API !== 'false';
  const baseUrl = import.meta.env.VITE_AXIM_API_URL || 'http://localhost:8787';

  // Timeout logic
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  options.signal = controller.signal;

  if (['POST', 'PUT', 'PATCH'].includes(options.method)) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${import.meta.env.VITE_AXIM_API_SECRET}`
    };
  }

  const mockTarget = API_BASE + endpoint;
  const edgeTarget = baseUrl + endpoint;

  if (useMock) {
     clearTimeout(timeoutId);
     return mockFetch(mockTarget, options);
  }

  try {
     const res = await fetch(edgeTarget, options);
     clearTimeout(timeoutId);
     if (!res.ok) {
        if (res.status === 401) {
             window.dispatchEvent(new Event('auth_error'));
             throw new Error('Authentication Failed: Invalid or missing API Secret.');
        }
        throw new Error(`Worker responded with ${res.status}`);
     }
     window.dispatchEvent(new CustomEvent('edge_status_update', { detail: { connected: true, msg: `Edge: Connected` } }));
     return res;
  } catch (err) {
     clearTimeout(timeoutId);
     if (err.name === 'AbortError' || err.message === 'Failed to fetch' || err.message.startsWith('Worker responded with')) {
        console.warn(`[Telemetry: Edge Unavailable -> Using Mock Adapter] ${err.message}`);
        window.dispatchEvent(new CustomEvent('edge_status_update', { detail: { connected: false, msg: 'Edge: Local Fallback' } }));
        // Ensure options doesn't still carry the aborted signal to the mock fetch if mockFetch implemented real fetch somehow, but mockFetch is local
        delete options.signal;
        return mockFetch(mockTarget, options);
     }
     throw err;
  }
};

export const machineService = {
  async getAll() {
    const res = await safeFetch('/machines');
    if (!res.ok) throw new Error('Failed to fetch machines');
    return res.json();
  },

  async create(data) {
    const res = await safeFetch('/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create machine');
    return res.json();
  },

  async update(id, data) {
    const res = await safeFetch(`/machines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update machine');
    return res.json();
  },

  async sendHeartbeat(payload) {
    const res = await safeFetch('/api/telemetry/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to send heartbeat');
    return res.json();
  }
};
