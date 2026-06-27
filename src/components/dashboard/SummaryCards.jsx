import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAnalytics } from '../../hooks/useAnalytics';
import { formatCurrency } from '../../utils/aximUtils';

const Card = ({ title, value, subtitle, icon, colorClass, delay, loading }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-axim-charcoal border border-axim-steel rounded-xl p-5 flex items-start justify-between relative overflow-hidden"
  >
    {loading && <div className="absolute inset-0 bg-axim-charcoal/50 backdrop-blur-[1px] flex items-center justify-center z-10">
      <div className="w-4 h-4 border-2 border-axim-emerald border-t-transparent rounded-full animate-spin" />
    </div>}
    <div>
      <p className="text-sm text-gray-400 font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
      {subtitle && <p className={`text-xs mt-2 ${colorClass}`}>{subtitle}</p>}
    </div>
    <div className="p-3 bg-axim-steel/40 rounded-lg">
      <SafeIcon name={icon} className={`text-xl ${colorClass}`} />
    </div>
  </motion.div>
);

export default function SummaryCards() {
  const { metrics, loading } = useAnalytics();

  const data = metrics || {
    totalCashYield: 0,
    activeRouteTemp: '0.0',
    fleetCount: 0,
    monthlyOverhead: 0
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card 
        title="Total Cash Yield" 
        value={formatCurrency(data.totalCashYield)} 
        subtitle={`Net after $${data.monthlyOverhead} OH`} 
        icon="FiDollarSign" 
        colorClass="text-axim-emerald" 
        delay={0.1}
        loading={loading}
      />
      <Card 
        title="Active Route Temp" 
        value={`${data.activeRouteTemp}°F`} 
        subtitle="Critical Threshold: 40°F" 
        icon="FiThermometer" 
        colorClass={parseFloat(data.activeRouteTemp) > 40 ? "text-axim-crimson" : "text-axim-emerald"} 
        delay={0.2}
        loading={loading}
      />
      <Card 
        title="Fleet Size" 
        value={data.fleetCount} 
        subtitle="Scale Target: 24 Units" 
        icon="FiGrid" 
        colorClass="text-axim-gold" 
        delay={0.3}
        loading={loading}
      />
      <Card 
        title="Operational OH" 
        value={formatCurrency(data.monthlyOverhead)} 
        subtitle="Scenario A (Garage)" 
        icon="FiHome" 
        colorClass="text-gray-400" 
        delay={0.4}
        loading={loading}
      />
    </div>
  );
}