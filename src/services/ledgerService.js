let transactions = [];
let listeners = [];
let totalTransactions = 0;

export const ledgerService = {
  subscribe(listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  getTransactions() {
    return [...transactions];
  },

  getTotalCount() {
    return totalTransactions;
  },

  async recordMicroTransaction(vendDetails) {
    try {
      console.log(`[Ledger Service] Recording micro-transaction:`, vendDetails);

      const newTx = {
        success: true,
        transactionId: crypto.randomUUID(),
        details: vendDetails,
        timestamp: new Date().toISOString()
      };

      totalTransactions++;
      transactions.push(newTx);
      if (transactions.length > 50) {
        transactions.shift(); // Keep only last 50
      }

      listeners.forEach(listener => listener(transactions));

      return newTx;
    } catch (error) {
      console.error('[Ledger Service] Error recording micro-transaction:', error);
      throw error;
    }
  }
};
