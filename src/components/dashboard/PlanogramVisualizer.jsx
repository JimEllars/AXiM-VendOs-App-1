import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { planogramService } from '../../services/planogramService';
import LoadingState from '../layout/LoadingState';
import { useMachines } from '../../hooks/useMachines';

export default function PlanogramVisualizer() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // We can get the pulseId from MachineContext to highlight which machine is vending
  // but for planogram, maybe we just want to pulse the specific item
  const { pulseId } = useMachines();

  useEffect(() => {
    let mounted = true;

    // Initial fetch to simulate the delay and loading state
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

    // Subscribe to live updates
    const unsubscribe = planogramService.subscribe((newData) => {
      if (mounted) {
         setData([...newData]);
         // if loading was still true, this will bypass it, which is fine,
         // it means we got data early via socket
         setLoading(false);
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
    <div className="bg-axim-charcoal border border-axim-steel rounded-xl overflow-hidden flex flex-col h-full">
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
              key={`${item.id}-${item.stock}`} // Force re-render/animation on stock change if needed
              initial={{ opacity: 0, rotateX: -20, scale: 0.9 }}
              animate={{ opacity: 1, rotateX: 0, scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
              className={`relative bg-axim-black rounded-lg p-3 border-2 transition-all duration-300 ${getStatusStyles(item.status)}`}
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
    </div>
  );
}
