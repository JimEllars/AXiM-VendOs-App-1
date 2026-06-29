export const economicsService = {
  async getFleetEconomics(settingsContext = null) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    let avgCM = 486.40;
    if (settingsContext) {
      avgCM = settingsContext.getSettingValue('AVG_CM_PER_UNIT', 486.40);
    }

    // Recalculate profit based on avgCM (simulating real backend calculation)
    // Base profit array logic scaled by the new avgCM
    const scaleFactor = avgCM / 486.40;

    return {
      months: ['Mo 03', 'Mo 06', 'Mo 12', 'Mo 18', 'Mo 24'],
      finance: {
        machines: [4, 7, 13, 19, 25],
        profit: [1296 * scaleFactor, 2593 * scaleFactor, 5186 * scaleFactor, 7779 * scaleFactor, 10372 * scaleFactor]
      },
      hybrid: {
        machines: [3, 6, 12, 18, 24],
        profit: [864 * scaleFactor, 2408 * scaleFactor, 5496 * scaleFactor, 8584 * scaleFactor, 11672 * scaleFactor]
      }
    };
  }
};
