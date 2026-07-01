import React, { useState } from 'react';
import SummaryCards from '../components/dashboard/SummaryCards';
import MachineStatusGrid from '../components/dashboard/MachineStatusGrid';
import FleetEconomicsChart from '../components/dashboard/FleetEconomicsChart';
import PlanogramVisualizer from '../components/dashboard/PlanogramVisualizer';
import ProvisionAssetModal from '../components/modals/ProvisionAssetModal';
import { machineService } from '../services/machineService';
import { planogramService } from '../services/planogramService';
import { useMachines } from '../hooks/useMachines';
import ErrorBoundary from '../components/layout/ErrorBoundary';

export default function Dashboard() {
  const [isModalOpen, setModalOpen] = useState(false);
  const { refresh } = useMachines();


  const fileInputRef = React.useRef(null);
  const [isUploadingDEX, setIsUploadingDEX] = useState(false);

  const handleDexUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

    const parseDexFile = (text) => {
    // Check for standard EVA-DTS header
    if (!text.includes('DXS*')) {
      throw new Error("Missing EVA-DTS header (DXS)");
    }

    // Simplified DEX parser extracting PA1 records
    // e.g., PA1*01*120*10*...
    const audits = [];
    const lines = text.split('\n');
    let hasPa1 = false;
    for (const line of lines) {
      if (line.startsWith('PA1')) {
        hasPa1 = true;
        const parts = line.split('*');
        if (parts.length >= 4) {
          const rawId = parts[1]; // e.g. "01"
          // Map raw ID to our format (A1, A2, etc for demo purposes)
          let selectionId = '';
          const num = parseInt(rawId, 10);
          if (num >= 1 && num <= 3) selectionId = `A${num}`;
          else if (num >= 4 && num <= 6) selectionId = `B${num - 3}`;

          if (selectionId) {
            audits.push({
              selectionId,
              stock: parseInt(parts[3], 10) || 0
            });
          }
        }
      }
    }

    if (!hasPa1) {
      throw new Error("Missing PA1 segments");
    }

    return audits;
  };

  const handleDexFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingDEX(true);

      try {
        const text = await file.text();
        let audits = [];
        if (file.name.endsWith('.dex') || file.name.endsWith('.txt')) {
          audits = parseDexFile(text);
        }

        // Simulate some network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (audits.length > 0) {
           await planogramService.updateBulk(audits);
           alert(`DEX File parsed. ${audits.length} PA1 audits synced.`);
           refresh();
        } else {
           alert('No valid PA1 stock audits found in DEX file. (Using mock PA1 records? PA1*01*...*10*)');
        }
      } catch (err) {
        alert('Invalid DEX File Format. Please ensure the file was exported correctly from the Nayax terminal.');
      } finally {
        setIsUploadingDEX(false);
        e.target.value = null;
      }
    }
  };

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

          <input
            type="file"
            accept=".txt, .dex"
            ref={fileInputRef}
            onChange={handleDexFileChange}
            className="hidden"
          />
          <button
            onClick={handleDexUploadClick}
            disabled={isUploadingDEX}
            className="bg-axim-steel text-white border-gray-600 border hover:bg-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {isUploadingDEX ? 'Parsing...' : 'Upload DEX Audit'}
          </button>
          <button 
            onClick={() => setModalOpen(true)}

            className="bg-axim-emerald hover:bg-emerald-400 text-axim-black px-4 py-2 rounded-md text-sm font-bold transition-colors shadow-[0_0_15px_rgba(0,229,163,0.3)]"
          >
            + Provision Asset
          </button>
        </div>
      </div>

      <ErrorBoundary>
        <SummaryCards />
      </ErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ErrorBoundary>
            <FleetEconomicsChart />
          </ErrorBoundary>
          <ErrorBoundary>
            <MachineStatusGrid />
          </ErrorBoundary>
        </div>
        <div className="lg:col-span-1 h-[800px]">
          <ErrorBoundary>
            <PlanogramVisualizer />
          </ErrorBoundary>
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
