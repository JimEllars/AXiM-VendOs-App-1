import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useMachines } from '../../hooks/useMachines';

const StatusBadge = ({ status }) => {
  const styles = {
    ACTIVE: 'bg-axim-emerald/10 text-axim-emerald border-axim-emerald/20',
    REFILL: 'bg-axim-gold/10 text-axim-gold border-axim-gold/20',
    CRITICAL: 'bg-axim-crimson/10 text-axim-crimson border-axim-crimson/20 pulse-fast',
  };
  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded border uppercase ${styles[status] || styles.ACTIVE}`}>
      {status}
    </span>
  );
};

export default function MachineStatusGrid() {
  const { machines, loading } = useMachines();

  if (loading) return (
    <div className="bg-axim-charcoal border border-axim-steel rounded-xl h-96 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-axim-emerald border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500">Syncing telemetry...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-axim-charcoal border border-axim-steel rounded-xl overflow-hidden">
      <div className="p-5 border-b border-axim-steel flex justify-between items-center bg-axim-charcoal/50">
        <div className="flex items-center gap-2">
          <SafeIcon name="FiServer" className="text-gray-400" />
          <h2 className="font-semibold text-white">Live Asset Telemetry</h2>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-axim-emerald animate-pulse"></span>
          {machines.length} Units Online
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
        {machines.length === 0 ? (
          <div className="col-span-full p-10 text-center text-gray-500 italic">
            No assets provisioned. Click "+ Provision Asset" to begin.
          </div>
        ) : machines.map((machine, i) => (
          <motion.div 
            key={machine.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="p-4 border border-axim-steel rounded-lg bg-axim-black flex flex-col justify-between hover:border-axim-emerald/30 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] text-gray-500 font-mono mb-1">{machine.id}</p>
                <p className="text-sm font-medium text-gray-200 group-hover:text-axim-emerald transition-colors">{machine.location}</p>
                <p className="text-[10px] text-gray-600 uppercase mt-0.5">{machine.model}</p>
              </div>
              <StatusBadge status={machine.status} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-axim-charcoal rounded p-2 text-center border border-axim-steel/50">
                <p className="text-[10px] text-gray-500 uppercase">Stock</p>
                <p className={`text-sm font-bold ${machine.stock < 30 ? 'text-axim-crimson' : machine.stock < 60 ? 'text-axim-gold' : 'text-axim-emerald'}`}>
                  {machine.stock}%
                </p>
              </div>
              <div className="bg-axim-charcoal rounded p-2 text-center border border-axim-steel/50">
                <p className="text-[10px] text-gray-500 uppercase">Temp</p>
                <p className={`text-sm font-bold ${machine.temp > 40 ? 'text-axim-crimson' : 'text-gray-200'}`}>
                  {machine.temp}°
                </p>
              </div>
              <div className="bg-axim-charcoal rounded p-2 text-center border border-axim-steel/50">
                <p className="text-[10px] text-gray-500 uppercase">Type</p>
                <p className="text-[10px] font-bold text-gray-400">{machine.type}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}