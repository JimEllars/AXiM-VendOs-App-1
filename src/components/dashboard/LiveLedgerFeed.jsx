import React, { useState, useEffect } from 'react';
import { ledgerService } from '../../services/ledgerService';
import SafeIcon from '../../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveLedgerFeed() {
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const unsubscribe = ledgerService.subscribe((txs) => {
      // Keep only the most recent 50 for performance in UI
      setTransactions([...txs].reverse().slice(0, 50));
      setTotalCount(ledgerService.getTotalCount());
    });

    // Also get existing
    setTransactions(ledgerService.getTransactions().reverse().slice(0, 50));
    setTotalCount(ledgerService.getTotalCount());

    return () => unsubscribe();
  }, []);

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatTime = (isoString) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="bg-axim-charcoal border border-axim-steel rounded-xl overflow-hidden flex flex-col h-full max-h-[500px]">
      <div className="p-5 border-b border-axim-steel flex justify-between items-center bg-axim-black/50">
        <div className="flex items-center gap-2">
          <SafeIcon name="FiActivity" className="text-axim-emerald animate-pulse" />
          <h2 className="font-semibold text-white">Live Ledger Feed</h2>
        </div>
        <span className="text-xs text-gray-400 bg-axim-black px-2 py-1 rounded border border-axim-steel">Micro-transactions</span>
      </div>

      <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full mt-10 space-y-4">
            <SafeIcon name="FiRefreshCw" className="text-axim-emerald text-3xl animate-spin" />
            <div className="text-center text-gray-400 text-sm font-mono animate-pulse">Status: Connecting to AXiM Core...</div>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-gray-400 uppercase bg-axim-black/30 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="p-2 font-medium">Time</th>
                <th className="p-2 font-medium">Machine</th>
                <th className="p-2 font-medium">Item</th>
                <th className="p-2 font-medium">Amount</th>
                <th className="p-2 font-medium text-axim-emerald">Ad Spend Cut</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {transactions.map((tx) => (
                  <motion.tr
                    key={tx.transactionId}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-axim-steel/50 hover:bg-axim-black/40 transition-colors"
                  >
                    <td className="p-2 font-mono text-xs text-gray-400">{formatTime(tx.timestamp)}</td>
                    <td className="p-2 font-mono text-xs text-gray-300">{tx.details.machineId}</td>
                    <td className="p-2 text-gray-300 truncate max-w-[120px]">{tx.details.item || 'Unknown'}</td>
                    <td className="p-2 font-mono text-white">{formatCurrency(tx.details.amount || 2.50)}</td>
                    <td className="p-2 font-mono text-axim-emerald font-bold">{formatCurrency(0.15)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="p-3 bg-axim-black border-t border-axim-steel flex justify-between items-center text-sm">
        <span className="text-gray-400 font-medium">Session Ad Spend Generated</span>
        <span className="text-axim-emerald font-bold font-mono">
          {formatCurrency(totalCount * 0.15)}
        </span>
      </div>
    </div>
  );
}
