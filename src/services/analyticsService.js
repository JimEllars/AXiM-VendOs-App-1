import { machineService } from './machineService';
import { settingsService } from './settingsService';

export const analyticsService = {
  async getSummaryMetrics(providedMachines = null) {
    const machines = providedMachines || await machineService.getAll();
    const settings = await settingsService.getAll();
    
    const avgCM = parseFloat(settings.find(s => s.key === 'AVG_CM_PER_UNIT')?.value || 486.40);
    const scenarioA_FC = parseFloat(settings.find(s => s.key === 'SCENARIO_A_FC')?.value || 1100);

    const activeCount = machines.filter(m => m.status === 'ACTIVE').length;
    const totalCount = machines.length;
    
    // Financial logic: Total Yield = (Active Machines * Avg CM) - Monthly Overhead
    const grossYield = totalCount * avgCM;
    const netYield = grossYield - scenarioA_FC;

    // Reliability logic: Avg Temp of active machines
    const avgTemp = machines.length > 0 
      ? machines.reduce((acc, m) => acc + m.temp, 0) / machines.length 
      : 38.5;

    return {
      totalCashYield: netYield,
      activeRouteTemp: avgTemp.toFixed(1),
      fleetCount: totalCount,
      monthlyOverhead: scenarioA_FC,
      criticalCount: machines.filter(m => m.status === 'CRITICAL').length
    };
  }
};
