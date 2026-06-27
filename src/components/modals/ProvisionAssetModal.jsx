import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { generateAximId } from '../../utils/aximUtils';

export default function ProvisionAssetModal({ isOpen, onClose, onProvision }) {
  const [formData, setFormData] = useState({
    region: 'DFW',
    supplier: 'N2G',
    model: 'Naturals2Go N2G4000',
    location: '',
    type: 'FINANCED'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = generateAximId(formData.region, formData.supplier);
    onProvision({ ...formData, id });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-axim-charcoal border border-axim-steel rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-axim-steel flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Provision New Asset</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <SafeIcon name="FiX" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Region</label>
              <select 
                className="w-full bg-axim-black border border-axim-steel rounded-lg p-2.5 text-white text-sm focus:border-axim-emerald outline-none"
                value={formData.region}
                onChange={(e) => setFormData({...formData, region: e.target.value})}
              >
                <option value="DFW">Dallas/FW</option>
                <option value="ETX">East Texas</option>
                <option value="VCO">Vending Co</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Supplier</label>
              <select 
                className="w-full bg-axim-black border border-axim-steel rounded-lg p-2.5 text-white text-sm focus:border-axim-emerald outline-none"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              >
                <option value="N2G">Naturals2Go</option>
                <option value="USI">USI/Wittern</option>
                <option value="RVM">Royal Vendors</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Model Name</label>
            <input 
              type="text"
              required
              className="w-full bg-axim-black border border-axim-steel rounded-lg p-2.5 text-white text-sm focus:border-axim-emerald outline-none"
              placeholder="e.g. N2G4000 Combo"
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deployment Location</label>
            <input 
              type="text"
              required
              className="w-full bg-axim-black border border-axim-steel rounded-lg p-2.5 text-white text-sm focus:border-axim-emerald outline-none"
              placeholder="e.g. Methodist Hospital North"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-axim-emerald hover:bg-emerald-400 text-axim-black font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(0,229,163,0.2)]"
            >
              Initialize Governance & Provision
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}