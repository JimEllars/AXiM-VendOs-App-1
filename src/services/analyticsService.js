import { machineService } from './machineService';
import { ledgerService } from './ledgerService';

export const analyticsService = {
  async getSummaryMetrics(providedMachines = null, settingsContext = null) {
    const machines = providedMachines || await machineService.getAll();
    
    let avgCM = 486.40;
    let scenarioA_FC = 1100;

    if (settingsContext) {
       avgCM = settingsContext.getSettingValue('AVG_CM_PER_UNIT', 486.40);
       scenarioA_FC = settingsContext.getSettingValue('SCENARIO_A_FC', 1100);
    }

    const activeCount = machines.filter(m => m.status === 'ACTIVE').length;
    const totalCount = machines.length;
    
    // Financial logic: Total Yield using ACTUAL transactions and settings
    const transactions = ledgerService.getTransactions();
    const grossYieldFromLedger = transactions.reduce((acc, tx) => acc + (tx.details?.amount || 0), 0);

    // Instead of using theoretical machine counts, we use actual ledger data.
    // However, since it's a micro-transaction ledger, we might scale it up for the 'yield' view
    // or just show the actual ledger gross. Let's show actual gross - overhead for true real-time.
    // If the requirement meant "calculate yield based on actual ledger VENDS", we do that here:
    // "fetch the aggregate "Session Ad Spend / Yield" directly from the ledgerService.js (or pass it in via arguments from a context)."

    const sessionYield = grossYieldFromLedger;
    const netYield = sessionYield - scenarioA_FC; // Note: overhead might quickly make this negative in a short demo, but that's what math dictates.
                                                  // Actually, if we just use grossYield, let's keep it simple.

    // Let's use the actual transaction sum to represent real-time yield.
    const totalCashYield = netYield;

    // Reliability logic: Avg Temp of active machines
    const avgTemp = machines.length > 0 
      ? machines.reduce((acc, m) => acc + m.temp, 0) / machines.length 
      : 38.5;

    return {
      totalCashYield: totalCashYield,
      actualGrossYield: sessionYield,
      activeRouteTemp: avgTemp.toFixed(1),
      fleetCount: totalCount,
      monthlyOverhead: scenarioA_FC,
      criticalCount: machines.filter(m => m.status === 'CRITICAL').length
    };
  }
};
