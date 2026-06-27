import React, { useEffect, useState } from 'react';
import { useMachines } from '../hooks/useMachines';
import SafeIcon from '../common/SafeIcon';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import LoadingState from '../components/layout/LoadingState';
import { logisticsService } from '../services/logisticsService';

// Custom icons based on status
const createCustomIcon = (color, text = '') => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; font-size: 10px;">${text}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
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

  // Use deterministic pseudo-randomness based on ID so locations don't jump around
  const idNum = parseInt(machine.id.replace(/\D/g, '')) || 0;

  return [
    baseCoords[0] + ((idNum % 10) * 0.01 - 0.05),
    baseCoords[1] + (((idNum * 2) % 10) * 0.01 - 0.05)
  ];
};

export default function FleetMap() {
  const { machines, loading } = useMachines();
  const [optimalRoute, setOptimalRoute] = useState([]);

  useEffect(() => {
    if (machines && machines.length > 0) {
      logisticsService.getOptimalRoute(machines).then(setOptimalRoute);
    }
  }, [machines]);

  const hqLocation = [32.7767, -96.7970]; // DFW

  // Filter to just the priority machines (REFILL or CRITICAL) to draw the route
  const priorityMachines = optimalRoute.filter(m => m.status === 'REFILL' || m.status === 'CRITICAL');

  // Coordinates for the polyline: HQ -> Machine 1 -> Machine 2 ...
  const routeCoordinates = [hqLocation];

  const regionsInfo = {
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

                {/* HQ Marker */}
                <Marker position={hqLocation} icon={createCustomIcon('#3b82f6', 'HQ')}>
                  <Popup>
                    <div className="text-xs font-sans">
                      <strong className="block text-gray-800">Dallas HQ</strong>
                    </div>
                  </Popup>
                </Marker>

                {machines.map(m => {
                   const pos = getMachineLocation(m);
                   let icon = icons[m.status] || icons.ACTIVE;

                   // Check if it's in the optimal route and needs routing
                   const routeIndex = priorityMachines.findIndex(pm => pm.id === m.id);
                   if (routeIndex !== -1) {
                      routeCoordinates.push(pos);
                      // Create a custom icon with the sequence number
                      const color = m.status === 'CRITICAL' ? '#FF3366' : '#D4AF37';
                      icon = createCustomIcon(color, (routeIndex + 1).toString());
                   }

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
                             {routeIndex !== -1 && (
                               <span className="block text-blue-600 mt-1">Route Stop: #{routeIndex + 1}</span>
                             )}
                           </div>
                        </Popup>
                     </Marker>
                   )
                })}

                {/* Draw Route Line */}
                {routeCoordinates.length > 1 && (
                  <Polyline
                    positions={routeCoordinates}
                    color="#3b82f6"
                    weight={3}
                    dashArray="5, 10"
                    opacity={0.7}
                  />
                )}
             </MapContainer>
           )}
        </div>

        <div className="space-y-4">
          {Object.entries(regionsInfo).map(([code, data]) => (
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
                {grouped[code]?.map(m => {
                  const routeIndex = priorityMachines.findIndex(pm => pm.id === m.id);
                  return (
                    <div key={m.id} className="flex justify-between items-center p-2 bg-axim-black/50 rounded border border-axim-steel/30 text-xs">
                      <span className="text-gray-300">
                        {m.location}
                        {routeIndex !== -1 && <span className="ml-2 text-blue-400 font-bold">(Stop #{routeIndex + 1})</span>}
                      </span>
                      <span className={`font-mono ${
                        m.status === 'CRITICAL' ? 'text-axim-crimson' :
                        m.status === 'REFILL' ? 'text-axim-gold' : 'text-axim-emerald'
                      }`}>
                        {m.stock}% ({m.status})
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
