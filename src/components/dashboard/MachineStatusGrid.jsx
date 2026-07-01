import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useMachines } from '../../hooks/useMachines';
import { machineService } from '../../services/machineService';
import LoadingState from '../layout/LoadingState';

const StatusBadge = ({ status }) => {
  const styles = {
    ACTIVE: 'bg-axim-emerald/10 text-axim-emerald border-axim-emerald/20',
    REFILL: 'bg-axim-gold/10 text-axim-gold border-axim-gold/20',
    CRITICAL: 'bg-axim-crimson/10 text-axim-crimson border-axim-crimson/20 pulse-fast',
    ONYX_DISPATCHED: 'bg-axim-crimson/20 text-axim-gold border-axim-gold/50 animate-pulse font-bold',
  };
  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded border uppercase ${styles[status] || styles.ACTIVE}`}>
      {status}
    </span>
  );
};

const QuickActionsMenu = ({ machine, onUpdate, isProcessing, setProcessing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRestock = async (e) => {
    e.stopPropagation();
    setIsOpen(false);
    setProcessing(machine.id, true);

    try {
      const updateData = { stock: 100, temp: 38.0, status: 'ACTIVE' };
      await machineService.update(machine.id, updateData);

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setProcessing(machine.id, false);
        if (onUpdate) onUpdate();
      }, 1000);
    } catch (err) {
      setProcessing(machine.id, false);
    }
  };

  return (
    <div className="absolute top-0 right-0 z-20">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="text-gray-500 hover:text-white p-1 rounded hover:bg-axim-steel/50 transition-colors"
        disabled={isProcessing}
      >
        <SafeIcon name="FiMoreVertical" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 mt-1 w-56 bg-axim-charcoal border border-axim-steel rounded shadow-xl overflow-hidden"
          >
            <button
              onClick={handleRestock}
              disabled={isProcessing}
              className={`w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-axim-steel/50 hover:text-axim-emerald transition-colors flex items-center gap-2 ${isSuccess ? 'bg-axim-emerald/20 text-axim-emerald' : ''}`}
            >
              {isProcessing ? (
                <><SafeIcon name="FiLoader" className="animate-spin" /> Processing...</>
              ) : isSuccess ? (
                <><SafeIcon name="FiCheck" className="text-axim-emerald" /> Success</>
              ) : (
                <><SafeIcon name="FiRefreshCw" /> Force Restock / Clear Faults</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function MachineStatusGrid() {
  const [processingMachines, setProcessingMachines] = useState({});

  const setProcessing = (id, isProcessing) => {
    setProcessingMachines(prev => ({ ...prev, [id]: isProcessing }));
  };
  const { machines, loading, pulseId, refresh } = useMachines();

  if (loading && machines.length === 0) return (
    <div className="bg-axim-charcoal border border-axim-steel rounded-xl h-96 flex items-center justify-center">
      <LoadingState message="Syncing telemetry..." />
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
            className={`p-4 border rounded-lg bg-axim-black flex flex-col justify-between transition-all cursor-pointer group relative overflow-hidden ${
              pulseId === machine.id
                ? 'border-axim-emerald shadow-[0_0_15px_rgba(0,229,163,0.3)]'
                : machine.status === 'ONYX_DISPATCHED'
                ? 'border-axim-crimson shadow-[0_0_20px_rgba(255,59,48,0.5)] animate-pulse'
                : machine.status === 'CRITICAL'
                ? 'border-axim-crimson shadow-[0_0_15px_rgba(255,59,48,0.3)]'
                : machine.status === 'REFILL'
                ? 'border-axim-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'border-axim-steel hover:border-axim-emerald/30'
            }`}
          >
             <AnimatePresence>
               {pulseId === machine.id && (
                 <motion.div
                   initial={{ opacity: 0.5, scale: 0.8 }}
                   animate={{ opacity: 0, scale: 1.5 }}
                   exit={{ opacity: 0 }}
                   transition={{ duration: 1 }}
                   className={`absolute inset-0 pointer-events-none ${
                     machine.status === 'ONYX_DISPATCHED' ? 'bg-axim-crimson/20' :
                     machine.status === 'CRITICAL' ? 'bg-axim-crimson/20' :
                     machine.status === 'REFILL' ? 'bg-axim-gold/20' :
                     'bg-axim-emerald/20'
                   }`}
                 />
               )}
             </AnimatePresence>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-[10px] text-gray-500 font-mono mb-1">{machine.id}</p>
                <p className="text-sm font-medium text-gray-200 group-hover:text-axim-emerald transition-colors">{machine.location}</p>
                <p className="text-[10px] text-gray-600 uppercase mt-0.5">{machine.model}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={machine.status} />
                <QuickActionsMenu machine={machine} onUpdate={refresh} isProcessing={processingMachines[machine.id]} setProcessing={setProcessing} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 relative z-10">
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
