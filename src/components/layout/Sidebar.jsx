import React from 'react';
import { NavLink } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { name: 'Overviews', icon: 'FiGrid', path: '/' },
  { name: 'Fleet Map', icon: 'FiMap', path: '/map' },
  { name: 'Inventory', icon: 'FiBox', path: '/inventory' },
  { name: 'Logistics', icon: 'FiTruck', path: '/logistics' },
  { name: 'Cash Flow', icon: 'FiDollarSign', path: '/finance' },
  { name: 'Settings', icon: 'FiSettings', path: '/settings' },
];

export default function Sidebar() {
  const { role } = useAuth();
  const visibleNavItems = role === 'DRIVER' ? navItems.filter(item => ['Fleet Map', 'Logistics'].includes(item.name)) : navItems;
  return (
    <aside className="w-64 bg-axim-charcoal border-r border-axim-steel flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 border-b border-axim-steel">
        <div className="w-8 h-8 bg-axim-emerald rounded uppercase flex items-center justify-center text-axim-black font-bold text-xl">
          V
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight text-white">VendOS</h1>
          <p className="text-xs text-gray-400">by AXiM Capital</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 ${
                isActive 
                  ? 'bg-axim-steel text-axim-emerald font-medium' 
                  : 'text-gray-400 hover:bg-axim-steel/50 hover:text-white'
              }`
            }
          >
            <SafeIcon name={item.icon} className="text-lg" />
            <span className="text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-axim-steel">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors">
          <SafeIcon name="FiLogOut" />
          <span>Logout</span>
        </div>
      </div>
    </aside>
  );
}