import { machineService } from './machineService';

// Basic Haversine formula to calculate mock deterministic travel time
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Map regions to mock coordinates for logistics
const regions = {
  'DFW': [32.7767, -96.7970],
  'ETX': [32.3513, -95.3011],
  'VCO': [33.2148, -97.1331]
};

const getBaseLocation = (id) => {
  const reg = id.split('-')[0];
  return regions[reg] || regions['DFW'];
};

export const logisticsService = {
  async getOptimalRoute(machinesList) {
    const machines = machinesList || await machineService.getAll();
    const hqLocation = regions['DFW']; // Assume HQ is in DFW
    
    // Simple heuristic: Prioritize CRITICAL, then REFILL
    const priority = {
      'CRITICAL': 0,
      'REFILL': 1,
      'ACTIVE': 2
    };

    return machines
      .filter(m => m.status !== 'ACTIVE')
      .sort((a, b) => priority[a.status] - priority[b.status])
      .map(m => {
         const machineLocation = getBaseLocation(m.id);
         // Simulate some random scatter for deterministic but varied coordinates
         const lat = machineLocation[0] + (m.id.charCodeAt(0) * 0.001);
         const lon = machineLocation[1] + (m.id.charCodeAt(1) * 0.001);

         const distance = calculateDistance(hqLocation[0], hqLocation[1], lat, lon);

         // Assuming avg speed 60km/h (1km per minute) + 10 mins loading
         const estimatedTime = Math.floor(distance) + 10;

         return {
          id: m.id,
          location: m.location,
          status: m.status,
          stock: m.stock,
          estimated_time: estimatedTime
        };
      });
  }
};
