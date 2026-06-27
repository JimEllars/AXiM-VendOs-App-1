export const economicsService = {
  async getFleetEconomics() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      months: ['Mo 03', 'Mo 06', 'Mo 12', 'Mo 18', 'Mo 24'],
      finance: {
        machines: [4, 7, 13, 19, 25],
        profit: [1296, 2593, 5186, 7779, 10372]
      },
      hybrid: {
        machines: [3, 6, 12, 18, 24],
        profit: [864, 2408, 5496, 8584, 11672]
      }
    };
  }
};
