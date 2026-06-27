import React from 'react';
import SafeIcon from '../common/SafeIcon';
import FleetEconomicsChart from '../components/dashboard/FleetEconomicsChart';
import LiveLedgerFeed from '../components/dashboard/LiveLedgerFeed';

const scenarios = [
  { name: 'Original Scenario', fc: 2600.00, breakeven: 5.88, target: 17.19, details: 'Warehouse + Truck' },
  { name: 'Scenario A', fc: 1100.00, breakeven: 2.49, target: 13.80, details: 'Garage + Truck' },
  { name: 'Scenario B', fc: 0.00, breakeven: 0.00, target: 11.31, details: 'Pure Home-Based' },
];

export default function Finance() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Modeling</h1>
          <p className="text-sm text-gray-400 mt-1">Capital allocation and breakeven fleet projections.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {scenarios.map((s) => (
          <div key={s.name} className="bg-axim-charcoal border border-axim-steel rounded-xl p-5 border-l-4 border-l-axim-gold">
            <h3 className="text-lg font-bold text-white mb-1">{s.name}</h3>
            <p className="text-xs text-gray-500 mb-4">{s.details}</p>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fixed Cost (FC)</span>
                <span className="text-white font-mono">${s.fc.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Breakeven Fleet</span>
                <span className="text-axim-emerald font-bold">~{Math.ceil(s.breakeven)} Units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Target Profit Fleet</span>
                <span className="text-axim-gold font-bold">~{Math.ceil(s.target)} Units</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FleetEconomicsChart />
        <div className="bg-axim-charcoal border border-axim-steel rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6 text-axim-emerald">
              <SafeIcon name="FiZap" className="text-xl" />
              <h2 className="font-bold text-lg">Snowball Purchase Trigger</h2>
            </div>
            <div className="relative h-4 w-full bg-axim-black rounded-full border border-axim-steel overflow-hidden mb-4">
               <div className="absolute top-0 left-0 h-full bg-axim-emerald" style={{ width: '65%' }} />
            </div>
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Current Reserve</p>
                <p className="text-3xl font-bold text-white">$1,170.00</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Next Refurb Purchase</p>
                <p className="text-xl font-bold text-axim-gold">$1,800.00</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed italic border-t border-axim-steel pt-4">
              "As cash reserves hit the $1,800 threshold, the system triggers procurement of a refurbished machine to eliminate lease payments and boost CMm to $514.68."
            </p>
          </div>
        </div>
      </div>

      {/* New Live Ledger Feed Component */}
      <div className="w-full">
        <LiveLedgerFeed />
      </div>
    </div>
  );
}
