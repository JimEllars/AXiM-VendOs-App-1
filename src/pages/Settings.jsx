import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';
import SafeIcon from '../common/SafeIcon';
import { motion } from 'framer-motion';

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    await settingsService.bootstrap();
    const data = await settingsService.getAll();
    setSettings(data);
    setLoading(false);
  };

  const handleUpdate = async (key, value) => {
    setSaving(true);
    await settingsService.updateValue(key, value);
    await loadSettings();
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-white">System Governance</h1>
        <p className="text-sm text-gray-400 mt-1">Configure the global financial models and AXiM protocols.</p>
      </div>

      <div className="bg-axim-charcoal border border-axim-steel rounded-xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-axim-steel bg-axim-black/50">
          <h2 className="font-bold text-white flex items-center gap-2">
            <SafeIcon name="FiDollarSign" className="text-axim-gold" />
            Financial Parameters
          </h2>
        </div>
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading system parameters...</div>
          ) : settings.map((s) => (
            <div key={s.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-axim-black rounded-lg border border-axim-steel">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-200">{s.key.replace(/_/g, ' ')}</p>
                <p className="text-xs text-gray-500">{s.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="text"
                  defaultValue={s.value}
                  onBlur={(e) => handleUpdate(s.key, e.target.value)}
                  className="bg-axim-charcoal border border-axim-steel rounded px-3 py-1.5 text-sm font-mono text-axim-emerald outline-none focus:border-axim-emerald/50 w-32 text-right"
                />
                <div className="text-[10px] text-gray-600 uppercase font-mono">
                  Last Sync: {new Date(s.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-axim-charcoal border border-axim-steel rounded-xl p-6">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <SafeIcon name="FiDatabase" className="text-axim-emerald" />
          Backend Connection Status
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-axim-emerald/10 text-axim-emerald border border-axim-emerald/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-axim-emerald animate-pulse" />
            Connected to Google Sheets
          </div>
          <span className="text-gray-500 font-mono text-xs">ID: {import.meta.env.VITE_SPREADSHEET_ID.slice(0, 8)}...</span>
        </div>
      </div>
    </div>
  );
}