import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { planogramData } from '../../data/mockData';

export default function PlanogramVisualizer() {
  const getStatusStyles = (status) => {
    switch(status) {
      case 'optimal': return 'border-axim-emerald shadow-[0_0_10px_rgba(0,229,163,0.2)]';
      case 'warning': return 'border-axim-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]';
      case 'critical': return 'border-axim-crimson shadow-[0_0_15px_rgba(255,59,48,0.4)] animate-pulse-fast';
      default: return 'border-axim-steel';
    }
  };

  return (
    <div className="bg-axim-charcoal border border-axim-steel rounded-xl overflow-hidden flex flex-col">
      <div className="p-5 border-b border-axim-steel flex justify-between items-center">
        <div className="flex items-center gap-2">
          <SafeIcon name="FiLayout" className="text-gray-400" />
          <h2 className="font-semibold text-white">Live Planogram Telemetry</h2>
        </div>
        <span className="text-xs font-mono text-gray-400 bg-axim-black px-2 py-1 rounded">DFW-EJR-2607-042</span>
      </div>
      
      <div className="p-6 flex-1 flex flex-col justify-center bg-gradient-to-b from-axim-charcoal to-axim-black">
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto w-full perspective-1000">
          {planogramData.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, rotateX: -20 }}
              animate={{ opacity: 1, rotateX: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-axim-black rounded-lg p-3 border-2 transition-all ${getStatusStyles(item.status)}`}
            >
              <div className="absolute top-1 right-2 text-[10px] font-mono text-gray-500">{item.id}</div>
              <div className="mt-2 text-center">
                <SafeIcon 
                  name={item.id.startsWith('A') ? 'FiCoffee' : 'FiDroplet'} 
                  className={`mx-auto text-2xl mb-2 ${item.status === 'optimal' ? 'text-gray-300' : item.status === 'critical' ? 'text-axim-crimson' : 'text-gray-500'}`} 
                />
                <p className="text-[10px] text-gray-400 truncate w-full px-1">{item.product}</p>
                <div className="mt-2 w-full bg-axim-steel/50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full ${item.status === 'optimal' ? 'bg-axim-emerald' : item.status === 'warning' ? 'bg-axim-gold' : 'bg-axim-crimson'}`}
                    style={{ width: `${(item.stock / item.capacity) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] font-mono mt-1 text-gray-500">{item.stock}/{item.capacity}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}