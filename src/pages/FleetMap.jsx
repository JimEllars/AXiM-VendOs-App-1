import React from 'react';
import { useMachines } from '../hooks/useMachines';
import SafeIcon from '../common/SafeIcon';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getMachineLocation = (machine) => {
  // Mock coordinate calculation based on region and some random jitter
  const regions = {
    'DFW': [32.7767, -96.7970],
    'ETX': [32.3513, -95.3011],
    'VCO': [33.2148, -97.1331]
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
    'ETX': { name: 'East Texas', coords: '32.3513° N, 95.3011° W', center: [32.3513, -95.3011] },
    'VCO': { name: 'Vending Co Territory', coords: '33.2148° N, 97.1331° W', center: [33.2148, -97.1331] }
  };

  const grouped = machines.reduce((acc, m) => {
    const reg = m.id.split('-')[0];
    if (!acc[reg]) acc[reg] = [];
    acc[reg].push(m);
    return acc;
  }, {});

  const centerPosition = [32.7767, -96.7970]; // Default DFW

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Fleet Geospatial Distribution</h1>
        <p className="text-sm text-gray-400 mt-1">Regional asset density and cluster analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-axim-charcoal border border-axim-steel rounded-xl p-1 min-h-[500px] flex flex-col relative z-0">
           <MapContainer center={centerPosition} zoom={7} className="h-full w-full rounded-lg bg-axim-black" style={{ minHeight: '500px' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="map-tiles"
              />
              {!loading && machines.map(m => {
                 const pos = getMachineLocation(m);
                 return (
                   <Marker key={m.id} position={pos}>
                      <Popup>
                         <div className="text-xs">
                           <strong className="block text-gray-800">{m.id}</strong>
                           <span className="block text-gray-600">{m.location}</span>
                           <span className={`block font-bold mt-1 ${m.status === 'ACTIVE' ? 'text-green-600' : 'text-orange-600'}`}>Status: {m.status}</span>
                         </div>
                      </Popup>
                   </Marker>
                 )
              })}
           </MapContainer>
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
