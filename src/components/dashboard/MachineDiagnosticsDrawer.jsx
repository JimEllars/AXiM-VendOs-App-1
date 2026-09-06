import React, { useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { MachineContext } from '../../context/MachineContext';
import { telemetryEmitter } from '../../utils/telemetrySimulator';

export default function MachineDiagnosticsDrawer() {
  const { machines, selectedMachineId, setSelectedMachineId } = useContext(MachineContext);
  const [localFeed, setLocalFeed] = useState([]);

  const machine = machines.find(m => m.id === selectedMachineId);
  const isOpen = !!machine;

  useEffect(() => {
     if (!isOpen) return;

     const handleRawEvent = (payload) => {
        if (payload.MachineId === selectedMachineId) {
           setLocalFeed(prev => [payload, ...prev].slice(0, 20));
        }
     };

     telemetryEmitter.on('raw', handleRawEvent);
     return () => telemetryEmitter.off('raw', handleRawEvent);
  }, [isOpen, selectedMachineId]);

  // Clear feed when opening a new machine
  useEffect(() => {
     if (isOpen) {
        setLocalFeed([]);
     }
  }, [selectedMachineId, isOpen]);


  if (!isOpen) return null;

  const handleAction = (actionName) => {
      window.dispatchEvent(new CustomEvent('globalAlert', {
          detail: { type: 'success', message: `${actionName} command sent to ${machine.id}.` }
      }));

      const payload = {
          MachineId: machine.id,
          Type: 'COMMAND_ACK',
          Command: actionName,
          Timestamp: new Date().toISOString()
      };
      telemetryEmitter.emit('raw', payload);
  };

  const isOffline = machine.status === 'CRITICAL';
  const isAlert = machine.status === 'ONYX_DISPATCHED' || machine.status === 'REFILL';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={() => setSelectedMachineId(null)}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-axim-charcoal border-l border-axim-steel shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-axim-steel flex justify-between items-center bg-axim-black/50">
            <div>
              <div className="flex items-center gap-3">
                 <h2 className="text-xl font-bold text-white">{machine.id}</h2>
                 <span className="relative flex h-3 w-3">
                   {!isOffline && (
                     <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAlert ? 'bg-axim-gold' : 'bg-axim-emerald'}`}></span>
                   )}
                   <span className={`relative inline-flex rounded-full h-3 w-3 ${isOffline ? 'bg-axim-crimson' : isAlert ? 'bg-axim-gold' : 'bg-axim-emerald'}`}></span>
                 </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">{machine.location} &bull; {machine.model}</p>
            </div>
            <button
              onClick={() => setSelectedMachineId(null)}
              className="p-2 text-gray-400 hover:text-white hover:bg-axim-steel/50 rounded-full transition-colors"
            >
              <SafeIcon name="FiX" className="text-xl" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            {/* Status Summary */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-axim-black p-4 rounded border border-axim-steel/50 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Temperature</p>
                  <p className={`text-2xl font-bold ${machine.temp > 45 ? 'text-axim-crimson' : 'text-white'}`}>{machine.temp}&deg;F</p>
                  <p className="text-[10px] text-gray-600 mt-1">Target: 38.0&deg;F</p>
               </div>
               <div className="bg-axim-black p-4 rounded border border-axim-steel/50 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Stock Level</p>
                  <p className={`text-2xl font-bold ${machine.stock < 30 ? 'text-axim-crimson' : machine.stock < 60 ? 'text-axim-gold' : 'text-axim-emerald'}`}>{machine.stock}%</p>
                  <p className="text-[10px] text-gray-600 mt-1">Capacity: 320 Units</p>
               </div>
            </div>

            {/* MDB Peripheral Health */}
            <div>
               <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                 <SafeIcon name="FiCpu" /> MDB Peripheral Health
               </h3>
               <div className="bg-axim-black rounded border border-axim-steel/50 divide-y divide-axim-steel/30">
                  <div className="p-3 flex justify-between items-center">
                     <span className="text-sm text-gray-400">Bill Validator</span>
                     <span className="text-xs font-bold text-axim-emerald flex items-center gap-1"><SafeIcon name="FiCheckCircle" /> OK</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                     <span className="text-sm text-gray-400">Coin Changer</span>
                     <span className="text-xs font-bold text-axim-emerald flex items-center gap-1"><SafeIcon name="FiCheckCircle" /> OK</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                     <span className="text-sm text-gray-400">Card Reader (Nayax)</span>
                     <span className="text-xs font-bold text-axim-emerald flex items-center gap-1"><SafeIcon name="FiCheckCircle" /> OK</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                     <span className="text-sm text-gray-400">Drop Sensor</span>
                     <span className="text-xs font-bold text-axim-emerald flex items-center gap-1"><SafeIcon name="FiCheckCircle" /> OK</span>
                  </div>
               </div>
            </div>

            {/* Live Telemetry Feed */}
            <div>
               <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                 <SafeIcon name="FiActivity" /> Live Feed (Filtered)
               </h3>
               <div className="bg-axim-black rounded border border-axim-steel/50 p-3 h-48 overflow-y-auto font-mono text-[10px] space-y-2">
                  {localFeed.length === 0 ? (
                     <div className="text-gray-600 italic text-center mt-10">Listening for events...</div>
                  ) : (
                     localFeed.map((event, idx) => (
                        <div key={idx} className="border-b border-axim-steel/30 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                           <span className="text-axim-emerald">[{new Date(event.Timestamp).toLocaleTimeString()}]</span>{' '}
                           <span className="text-gray-400">{event.Type}</span>{' '}
                           {event.Type === 'VEND' && <span className="text-gray-200">- {event.SelectionId} ({event.Item}) - {event.VendStatus}</span>}
                           {event.Type === 'TEMP_READING' && <span className="text-gray-200">- {event.NewTemp}&deg;F | RSSI: {event.RSSI}</span>}
                           {event.Type === 'COMMAND_ACK' && <span className="text-axim-gold">- {event.Command} Executed</span>}
                        </div>
                     ))
                  )}
               </div>
            </div>

          </div>

          {/* Actions Footer */}
          <div className="p-5 border-t border-axim-steel bg-axim-black/50 grid grid-cols-1 gap-3">
             <button onClick={() => handleAction('Trigger Test Vend')} className="w-full bg-axim-steel hover:bg-gray-700 text-white py-2.5 rounded text-sm font-medium transition-colors flex justify-center items-center gap-2">
                <SafeIcon name="FiPlay" /> Trigger Test Vend
             </button>
             <button onClick={() => handleAction('Reset MDB Bus')} className="w-full bg-axim-steel hover:bg-gray-700 text-white py-2.5 rounded text-sm font-medium transition-colors flex justify-center items-center gap-2">
                <SafeIcon name="FiRefreshCw" /> Reset MDB Bus
             </button>
             <button onClick={() => handleAction('Export DEX Log')} className="w-full border border-axim-steel hover:bg-axim-steel/50 text-gray-300 py-2.5 rounded text-sm font-medium transition-colors flex justify-center items-center gap-2">
                <SafeIcon name="FiDownload" /> Export DEX Log
             </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
