import React, { useState, useEffect } from 'react';
import { logisticsService } from '../services/logisticsService';
import SafeIcon from '../common/SafeIcon';
import { motion } from 'framer-motion';
import { useMachines } from '../hooks/useMachines';
import { machineService } from '../services/machineService';

export default function Logistics() {
  const { machines, loading: machinesLoading, refresh } = useMachines();
  const [completedStops, setCompletedStops] = useState(new Set());

  const handleCompleteService = async (machineId) => {
    try {
      const updateData = { stock: 100, temp: 38.0, status: 'ACTIVE' };
      await machineService.update(machineId, updateData);
      setCompletedStops(prev => new Set([...prev, machineId]));
      if (refresh) refresh();
    } catch (err) {
      console.error('Failed to complete service', err);
    }
  };

  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (machines && machines.length > 0) {
      logisticsService.getOptimalRoute(machines).then(data => {
        setRoute(data);
        setLoading(false);
      });
    } else if (!machinesLoading) {
       setLoading(false);
    }
  }, [machines, machinesLoading]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Logistics & Routing</h1>
          <p className="text-sm text-gray-400 mt-1">Priority-based route optimization for service technicians.</p>
        </div>
        <button className="bg-axim-emerald text-axim-black px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2">
          <SafeIcon name="FiNavigation" /> Dispatch Driver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-axim-charcoal border border-axim-steel rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Today's Optimized Sequence</h2>
            <div className="space-y-6 relative">
              <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-axim-steel border-dashed border-l-2 border-gray-700" />
              
              {loading ? (
                <p className="text-gray-500 text-center py-10">Calculating optimal path...</p>
              ) : route.length === 0 ? (
                <div className="text-center py-10">
                  <SafeIcon name="FiCheckCircle" className="text-axim-emerald text-3xl mx-auto mb-3" />
                  <p className="text-white font-medium">No service required</p>
                  <p className="text-sm text-gray-500">All machines are within optimal stock thresholds.</p>
                </div>
              ) : route.filter(stop => !completedStops.has(stop.id)).map((stop, idx) => (
                <motion.div 
                  key={stop.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-6 relative z-10"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                    stop.status === 'CRITICAL' ? 'bg-axim-crimson border-red-400 text-white' : 'bg-axim-gold border-yellow-300 text-axim-black'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 bg-axim-black border border-axim-steel rounded-xl p-4 hover:border-axim-emerald/30 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-100">{stop.location}</h3>
                        <p className="text-xs text-gray-500 font-mono mt-1">{stop.id}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        stop.status === 'CRITICAL' ? 'border-axim-crimson text-axim-crimson' : 'border-axim-gold text-axim-gold'
                      }`}>
                        {stop.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <SafeIcon name="FiBox" />
                        <span>Est. Fill: {100 - stop.stock}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <SafeIcon name="FiClock" />
                        <span>{stop.estimated_time} mins travel</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-axim-steel flex justify-end">
                      <button onClick={() => handleCompleteService(stop.id)} className="bg-axim-steel/50 hover:bg-axim-emerald text-white hover:text-axim-black text-xs font-bold py-1.5 px-3 rounded flex items-center gap-2 transition-colors">
                        <SafeIcon name="FiCheck" /> Complete Service
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-axim-charcoal border border-axim-steel rounded-xl p-6">
            <h3 className="text-white font-bold mb-4">Route Metrics</h3>
            <div className="space-y-4">
              <div className="p-4 bg-axim-black rounded-lg border border-axim-steel">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Travel Time</p>
                <p className="text-2xl font-bold text-white">1h 42m</p>
              </div>
              <div className="p-4 bg-axim-black rounded-lg border border-axim-steel">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Inventory Required</p>
                <p className="text-2xl font-bold text-axim-gold">14 Cases</p>
              </div>
              <div className="p-4 bg-axim-black rounded-lg border border-axim-steel">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Est. Revenue Recapture</p>
                <p className="text-2xl font-bold text-axim-emerald">$412.50</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}