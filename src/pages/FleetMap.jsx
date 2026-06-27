import React from 'react';
import { useMachines } from '../hooks/useMachines';
import SafeIcon from '../common/SafeIcon';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import LoadingState from '../components/layout/LoadingState';

// Custom icons based on status
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const icons = {
  ACTIVE: createCustomIcon('#00E5A3'), // axim-emerald
  REFILL: createCustomIcon('#D4AF37'), // axim-gold
  CRITICAL: createCustomIcon('#FF3366'), // axim-crimson
};

const getMachineLocation = (machine) => {
  // Target specifically Tyler, Longview, and DFW based on region
  const regions = {
    'DFW': [32.7767, -96.7970], // Dallas
    'ETX': [32.3513, -95.3011], // Tyler / Longview general area
    'VCO': [33.2148, -97.1331]  // Denton / Vending Co Territory
  };
  const reg = machine.id.split('-')[0];
  const baseCoords = regions[reg] || [32.7767, -96.7970];
  return [
    baseCoords[0] + (Math.random() * 0.1 - 0.05),
    baseCoords[1] + (Math.random() * 0.1 - 0.05)
  ];
};

export default function FleetMap() {
  const { machines, loading } = useMachines();

  const regions = {
    'DFW': { name: 'Dallas / Fort Worth', coords: '32.7767° N, 96.7970° W', center: [32.7767, -96.7970] },
    'ETX': { name: 'East Texas (Tyler/Longview)', coords: '32.3513° N, 95.3011° W', center: [32.3513, -95.3011] },
    'VCO': { name: 'Vending Co Territory', coords: '33.2148° N, 97.1331° W', center: [33.2148, -97.1331] }
  };

  const grouped = machines.reduce((acc, m) => {
    const reg = m.id.split('-')[0];
    if (!acc[reg]) acc[reg] = [];
    acc[reg].push(m);
    return acc;
  }, {});

  const centerPosition = [32.5, -96.0]; // Center between DFW and East Texas

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Fleet Geospatial Distribution</h1>
        <p className="text-sm text-gray-400 mt-1">Regional asset density and cluster analysis targeting Tyler, Longview, and DFW.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-axim-charcoal border border-axim-steel rounded-xl p-1 min-h-[500px] flex flex-col relative z-0">
           {loading ? (
             <div className="h-full flex items-center justify-center">
               <LoadingState message="Loading Map Data..." />
             </div>
           ) : (
             <MapContainer center={centerPosition} zoom={8} className="h-full w-full rounded-lg bg-axim-black" style={{ minHeight: '500px' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  className="map-tiles"
                />
                {machines.map(m => {
                   const pos = getMachineLocation(m);
                   const icon = icons[m.status] || icons.ACTIVE;
                   return (
                     <Marker key={m.id} position={pos} icon={icon}>
                        <Popup>
                           <div className="text-xs font-sans">
                             <strong className="block text-gray-800">{m.id}</strong>
                             <span className="block text-gray-600">{m.location}</span>
                             <span className={`block font-bold mt-1 ${
                               m.status === 'ACTIVE' ? 'text-green-600' :
                               m.status === 'REFILL' ? 'text-yellow-600' : 'text-red-600'
                             }`}>Status: {m.status}</span>
                             <span className="block text-gray-600">Stock: {m.stock}%</span>
                           </div>
                        </Popup>
                     </Marker>
                   )
                })}
             </MapContainer>
           )}
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
                    <span className={`font-mono ${
                      m.status === 'CRITICAL' ? 'text-axim-crimson' :
                      m.status === 'REFILL' ? 'text-axim-gold' : 'text-axim-emerald'
                    }`}>
                      {m.stock}% ({m.status})
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
