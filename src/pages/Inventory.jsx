import React, { useState, useEffect } from 'react';
import { inventoryService } from '../services/inventoryService';
import SafeIcon from '../common/SafeIcon';
import { motion } from 'framer-motion';

const EditableRetailCell = ({ item, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(item.retail_price.toFixed(2));

  const handleSave = () => {
    setIsEditing(false);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue !== item.retail_price) {
      onSave(item, numValue);
    } else {
      setValue(item.retail_price.toFixed(2)); // Reset if invalid
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(item.retail_price.toFixed(2));
    }
  };

  if (isEditing) {
    return (
      <td className="p-4 text-right font-mono text-gray-300">
        $<input
          type="number"
          step="0.01"
          autoFocus
          className="bg-axim-black border border-axim-steel text-white rounded px-2 py-1 w-20 text-right outline-none focus:border-axim-emerald"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
      </td>
    );
  }

  return (
    <td
      className="p-4 text-right font-mono text-gray-300 cursor-pointer hover:text-white group flex items-center justify-end gap-2"
      onClick={() => setIsEditing(true)}
    >
      <SafeIcon name="FiEdit2" className="opacity-0 group-hover:opacity-100 transition-opacity w-3 h-3 text-axim-emerald" />
      ${item.retail_price.toFixed(2)}
    </td>
  );
};

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

  const handleSaveItem = async (item, newRetailPrice) => {
    const marginNum = ((newRetailPrice - item.unit_cogs) / newRetailPrice) * 100;
    const marginStr = marginNum.toFixed(2) + '%';

    // Optimistic UI update
    setItems(currentItems =>
      currentItems.map(i =>
        i.id === item.id
          ? { ...i, retail_price: newRetailPrice, margin: marginStr }
          : i
      )
    );

    try {
      await inventoryService.updateItem(item.id, {
        retail_price: newRetailPrice,
        margin: marginStr
      });
      // Optionally trigger a full refresh if not relying entirely on subscriptions for this update
      inventoryService.getAll().then(setItems);
    } catch (err) {
      console.error('Failed to update price:', err);
      // Revert on error (could implement full revert logic here)
      inventoryService.getAll().then(setItems);
    }
  };

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
                <EditableRetailCell item={item} onSave={handleSaveItem} />
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
