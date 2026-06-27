import React from 'react';
import { useMachines } from '../hooks/useMachines';
import SafeIcon from '../common/SafeIcon';
import { motion } from 'framer-motion';

export default function FleetMap() {
  const { machines, loading } = useMachines();

  const regions = {
    'DFW': { name: 'Dallas / Fort Worth', coords: '32.7767° N, 96.7970° W' },
    'ETX': { name: 'East Texas', coords: '32.3513° N, 95.3011° W' },
    'VCO': { name: 'Vending Co Territory', coords: '33.2148° N, 97.1331° W' }
  };

  const grouped = machines.reduce((acc, m) => {
    const reg = m.id.split('-')[0];
    if (!acc[reg]) acc[reg] = [];
    acc[reg].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Fleet Geospatial Distribution</h1>
        <p className="text-sm text-gray-400 mt-1">Regional asset density and cluster analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-axim-charcoal border border-axim-steel rounded-xl p-6 min-h-[500px] flex flex-col">
          <div className="flex-1 border border-axim-steel bg-axim-black rounded-lg relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1000')] bg-cover grayscale" />
            <div className="relative z-10 text-center space-y-4">
              <SafeIcon name="FiMapPin" className="text-axim-emerald text-5xl mx-auto animate-bounce" />
              <p className="text-gray-400 max-w-xs mx-auto">Interactive Map Engine initializing. Regional clusters are being processed.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(regions).map(([code, data]) => (
            <motion.div 
              key={code}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-axim-charcoal border border-axim-steel rounded-xl p-5"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{data.name}</h3>
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">{code} | {data.coords}</p>
                </div>
                <div className="bg-axim-emerald text-axim-black px-3 py-1 rounded-full font-bold text-sm">
                  {grouped[code]?.length || 0} Assets
                </div>
              </div>
              
              <div className="space-y-2">
                {grouped[code]?.map(m => (
                  <div key={m.id} className="flex justify-between items-center p-2 bg-axim-black/50 rounded border border-axim-steel/30 text-xs">
                    <span className="text-gray-300">{m.location}</span>
                    <span className={`font-mono ${m.status === 'ACTIVE' ? 'text-axim-emerald' : 'text-axim-gold'}`}>
                      {m.stock}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}