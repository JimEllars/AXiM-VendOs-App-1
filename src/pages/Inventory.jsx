import React, { useState, useEffect } from 'react';
import { inventoryService } from '../services/inventoryService';
import SafeIcon from '../common/SafeIcon';
import { motion } from 'framer-motion';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;

    inventoryService.getAll().then(data => {
      if (data.length === 0) {
        inventoryService.seed().then(() => inventoryService.getAll().then(setItems));
      } else {
        setItems(data);
      }
      setLoading(false);
    });

    unsubscribe = inventoryService.subscribe((newData) => {
      setItems(newData);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Wholesale Inventory</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time margin tracking and COGS analysis.</p>
        </div>
        <button className="bg-axim-steel text-white px-4 py-2 rounded-md text-sm border border-gray-600 flex items-center gap-2">
          <SafeIcon name="FiDownload" /> Export Pick-List
        </button>
      </div>

      <div className="bg-axim-charcoal border border-axim-steel rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-axim-black border-b border-axim-steel">
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Unit COGS</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Retail</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Margin</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-axim-steel">
            {loading ? (
              <tr><td colSpan="6" className="p-10 text-center text-gray-500">Loading inventory data...</td></tr>
            ) : items.map((item, idx) => (
              <motion.tr 
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="hover:bg-axim-steel/20 transition-colors"
              >
                <td className="p-4">
                  <div className="font-medium text-gray-100">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.brand}</div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-axim-black rounded text-[10px] text-gray-400 border border-axim-steel">
                    {item.category}
                  </span>
                </td>
                <td className="p-4 text-right font-mono text-gray-300">${item.unit_cogs.toFixed(2)}</td>
                <td className="p-4 text-right font-mono text-gray-300">${item.retail_price.toFixed(2)}</td>
                <td className="p-4 text-right font-mono text-axim-emerald">{item.margin}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-axim-steel rounded-full overflow-hidden min-w-[60px]">
                      <div className="h-full bg-axim-emerald" style={{ width: `${typeof item.stock_level === 'number' ? item.stock_level.toFixed(1) : item.stock_level}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">{item.stock_level}%</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}