import React, { useState } from 'react';
import SummaryCards from '../components/dashboard/SummaryCards';
import MachineStatusGrid from '../components/dashboard/MachineStatusGrid';
import FleetEconomicsChart from '../components/dashboard/FleetEconomicsChart';
import PlanogramVisualizer from '../components/dashboard/PlanogramVisualizer';
import ProvisionAssetModal from '../components/modals/ProvisionAssetModal';
import { machineService } from '../services/machineService';
import { useMachines } from '../hooks/useMachines';

export default function Dashboard() {
  const [isModalOpen, setModalOpen] = useState(false);
  const { refresh } = useMachines();

  const handleProvision = async (data) => {
    try {
      await machineService.create(data);
      refresh();
    } catch (err) {
      alert('Provisioning failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Operations Console</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time telemetry and financial models.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-axim-steel hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600">
            Export Ledger
          </button>
          <button 
            onClick={() => setModalOpen(true)}
            className="bg-axim-emerald hover:bg-emerald-400 text-axim-black px-4 py-2 rounded-md text-sm font-bold transition-colors shadow-[0_0_15px_rgba(0,229,163,0.3)]"
          >
            + Provision Asset
          </button>
        </div>
      </div>

      <SummaryCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FleetEconomicsChart />
          <MachineStatusGrid />
        </div>
        <div className="lg:col-span-1">
          <PlanogramVisualizer />
        </div>
      </div>

      <ProvisionAssetModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onProvision={handleProvision}
      />
    </div>
  );
}