let transactions = [];
let listeners = [];

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

  async recordMicroTransaction(vendDetails) {
    try {
      console.log(`[Ledger Service] Recording micro-transaction:`, vendDetails);

      const newTx = {
        success: true,
        transactionId: crypto.randomUUID(),
        details: vendDetails,
        timestamp: new Date().toISOString()
      };

      transactions.push(newTx);

      listeners.forEach(listener => listener(transactions));

      return newTx;
    } catch (error) {
      console.error('[Ledger Service] Error recording micro-transaction:', error);
      throw error;
    }
  }
};
