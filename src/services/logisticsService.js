import { machineService } from './machineService';

export const logisticsService = {
  async getOptimalRoute() {
    const machines = await machineService.getAll();
    
    // Simple heuristic: Prioritize CRITICAL, then REFILL
    const priority = {
      'CRITICAL': 0,
      'REFILL': 1,
      'ACTIVE': 2
    };

    return machines
      .filter(m => m.status !== 'ACTIVE')
      .sort((a, b) => priority[a.status] - priority[b.status])
      .map(m => ({
        id: m.id,
        location: m.location,
        status: m.status,
        stock: m.stock,
        estimated_time: Math.floor(Math.random() * 15) + 10 // Simulated traffic
      }));
  }
};