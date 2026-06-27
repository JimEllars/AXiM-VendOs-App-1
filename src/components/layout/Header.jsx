import React from 'react';
import SafeIcon from '../../common/SafeIcon';
import { summaryMetrics } from '../../data/mockData';

export default function Header() {
  return (
    <header className="h-16 border-b border-axim-steel bg-axim-black/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <SafeIcon name="FiActivity" className="text-axim-emerald" />
        <span>System Status: <strong className="text-axim-emerald font-medium">All Systems Operational</strong></span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex bg-axim-steel/50 rounded-full px-4 py-1.5 items-center gap-2 border border-axim-steel">
           <span className="w-2 h-2 rounded-full bg-axim-emerald animate-pulse"></span>
           <span className="text-xs font-medium text-gray-300">Fleet Count: {summaryMetrics.fleetCount}</span>
        </div>
        
        <div className="flex items-center gap-3 border-l border-axim-steel pl-6">
          <div className="text-right">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-gray-400">Corporate Administrator</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-axim-steel flex items-center justify-center text-gray-300 border border-gray-700">
            <SafeIcon name="FiUser" />
          </div>
        </div>
      </div>
    </header>
  );
}