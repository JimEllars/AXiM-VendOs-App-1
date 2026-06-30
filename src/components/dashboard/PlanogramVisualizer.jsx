import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { planogramService } from '../../services/planogramService';
import { inventoryService } from '../../services/inventoryService';
import LoadingState from '../layout/LoadingState';
import { useMachines } from '../../hooks/useMachines';

export default function PlanogramVisualizer() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editor state
  const [editingItem, setEditingItem] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemPrice, setItemPrice] = useState(0);

  const { pulseId } = useMachines();

  useEffect(() => {
    let mounted = true;

    planogramService.getPlanogramData('DFW-EJR-2607-042')
      .then(res => {
        if(mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if(mounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    const unsubscribe = planogramService.subscribe((newData) => {
      if (mounted) {
         setData([...newData]);
         setLoading(false);
      }
    });

    inventoryService.getAll().then(res => {
      if (mounted) {
        setCatalog(res);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const getStatusStyles = (status) => {
    switch(status) {
      case 'optimal': return 'border-axim-emerald shadow-[0_0_10px_rgba(0,229,163,0.2)]';
      case 'warning': return 'border-axim-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]';
      case 'critical': return 'border-axim-crimson shadow-[0_0_15px_rgba(255,59,48,0.4)] animate-pulse-fast';
      default: return 'border-axim-steel';
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);

    // Try to match the current product to our catalog
    const matchedProduct = catalog.find(p => p.name === item.product);
    if (matchedProduct) {
      setSelectedProductId(matchedProduct.id);
      setItemPrice(matchedProduct.retail_price);
    } else {
      setSelectedProductId('');
      setItemPrice(0);
    }
  };

  const handleProductChange = (e) => {
    const pId = e.target.value;
    setSelectedProductId(pId);

    const prod = catalog.find(p => p.id === pId);
    if (prod) {
      setItemPrice(prod.retail_price);
    } else {
      setItemPrice(0);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !selectedProductId) return;

    const prod = catalog.find(p => p.id === selectedProductId);
    if (prod) {
      await planogramService.updateItem(editingItem.id, {
        product: prod.name
        // You could also store price in planogramService if needed
      });
    }
    setEditingItem(null);
  };

  if (loading) {
    return (
      <div className="bg-axim-charcoal border border-axim-steel rounded-xl p-5 h-full flex items-center justify-center">
        <LoadingState message="Loading Planogram Data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-axim-charcoal border border-axim-steel rounded-xl p-5 h-full flex flex-col items-center justify-center text-center">
         <SafeIcon name="FiAlertTriangle" className="text-axim-crimson text-3xl mb-2" />
         <p className="text-white font-medium mb-1">AXiM System Error</p>
         <p className="text-xs text-gray-400">Failed to load planogram telemetry: {error}</p>
      </div>
    )
  }

  return (
    <div className="bg-axim-charcoal border border-axim-steel rounded-xl overflow-hidden flex flex-col h-full relative">
      <div className="p-5 border-b border-axim-steel flex justify-between items-center">
        <div className="flex items-center gap-2">
          <SafeIcon name="FiLayout" className="text-gray-400" />
          <h2 className="font-semibold text-white">Live Planogram Telemetry</h2>
        </div>
        <span className="text-xs font-mono text-gray-400 bg-axim-black px-2 py-1 rounded">DFW-EJR-2607-042</span>
      </div>
      
      <div className="p-6 flex-1 flex flex-col justify-center bg-gradient-to-b from-axim-charcoal to-axim-black">
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto w-full perspective-1000">
          {data.map((item, i) => (
            <motion.div
              key={`${item.id}-${item.stock}`}
              initial={{ opacity: 0, rotateX: -20, scale: 0.9 }}
              animate={{ opacity: 1, rotateX: 0, scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
              className={`relative bg-axim-black rounded-lg p-3 border-2 transition-all duration-300 cursor-pointer hover:bg-gray-800 ${getStatusStyles(item.status)}`}
              onClick={() => handleEditClick(item)}
            >
              <div className="absolute top-1 right-2 text-[10px] font-mono text-gray-500">{item.id}</div>
              <div className="mt-2 text-center">
                <SafeIcon 
                  name={item.id.startsWith('A') ? 'FiCoffee' : 'FiDroplet'} 
                  className={`mx-auto text-2xl mb-2 transition-colors duration-300 ${item.status === 'optimal' ? 'text-gray-300' : item.status === 'critical' ? 'text-axim-crimson' : 'text-gray-500'}`}
                />
                <p className="text-[10px] text-gray-400 truncate w-full px-1">{item.product}</p>
                <div className="mt-2 w-full bg-axim-steel/50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${item.status === 'optimal' ? 'bg-axim-emerald' : item.status === 'warning' ? 'bg-axim-gold' : 'bg-axim-crimson'}`}
                    style={{ width: `${(item.stock / item.capacity) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] font-mono mt-1 text-gray-500">{item.stock}/{item.capacity}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {editingItem && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 bg-axim-black border border-axim-steel p-4 rounded-xl shadow-2xl z-20"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-medium text-sm">Edit Coil {editingItem.id}</h3>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-white">
                <SafeIcon name="FiX" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Product Assignment</label>
                <select
                  value={selectedProductId}
                  onChange={handleProductChange}
                  className="w-full bg-axim-charcoal border border-axim-steel rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-axim-emerald"
                >
                  <option value="">-- Select Product --</option>
                  {catalog.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.brand} - {prod.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Retail Price ($)</label>
                <input
                  type="number"
                  readOnly
                  value={itemPrice.toFixed(2)}
                  className="w-full bg-axim-charcoal/50 border border-axim-steel rounded px-3 py-2 text-sm text-gray-400 focus:outline-none cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-500 mt-1">Price automatically bound to wholesale catalog</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!selectedProductId}
                  className="bg-axim-emerald text-axim-black px-4 py-1.5 rounded text-xs font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
