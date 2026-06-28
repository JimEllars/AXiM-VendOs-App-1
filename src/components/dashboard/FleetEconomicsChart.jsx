import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { economicsService } from '../../services/economicsService';
import SafeIcon from '../../common/SafeIcon';
import LoadingState from '../layout/LoadingState';
import { useSettings } from '../../context/SettingsContext';

export default function FleetEconomicsChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const settingsContext = useSettings();

  useEffect(() => {
    let mounted = true;
    if (settingsContext.loading) return;

    setLoading(true);
    economicsService.getFleetEconomics(settingsContext)
      .then(res => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      })
    return () => mounted = false;
  }, [settingsContext.settings, settingsContext.loading])

  if (loading) {
    return (
      <div className="bg-axim-charcoal border border-axim-steel rounded-xl p-5 h-full flex flex-col items-center justify-center">
        <LoadingState message="Calculating Economics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-axim-charcoal border border-axim-steel rounded-xl p-5 h-full flex flex-col items-center justify-center text-center">
         <SafeIcon name="FiAlertTriangle" className="text-axim-crimson text-3xl mb-2" />
         <p className="text-white font-medium mb-1">AXiM System Error</p>
         <p className="text-xs text-gray-400">Failed to calculate economics: {error}</p>
      </div>
    )
  }

  const options = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#16161A',
      borderColor: '#2A2C35',
      textStyle: { color: '#E5E7EB' }
    },
    legend: {
      data: ['Finance Profit', 'Hybrid Cash Profit'],
      textStyle: { color: '#9CA3AF' },
      bottom: 0
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.months,
      axisLine: { lineStyle: { color: '#2A2C35' } },
      axisLabel: { color: '#9CA3AF' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#2A2C35' } },
      splitLine: { lineStyle: { color: '#2A2C35', type: 'dashed' } },
      axisLabel: { 
        color: '#9CA3AF',
        formatter: (value) => `$${value/1000}k`
      }
    },
    series: [
      {
        name: 'Finance Profit',
        type: 'line',
        data: data.finance.profit,
        itemStyle: { color: '#D4AF37' },
        lineStyle: { width: 2 },
        smooth: true
      },
      {
        name: 'Hybrid Cash Profit',
        type: 'line',
        data: data.hybrid.profit,
        itemStyle: { color: '#00E5A3' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 229, 163, 0.3)' },
              { offset: 1, color: 'rgba(0, 229, 163, 0.0)' }
            ]
          }
        },
        lineStyle: { width: 3 },
        smooth: true
      }
    ]
  };

  return (
    <div className="bg-axim-charcoal border border-axim-steel rounded-xl p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <SafeIcon name="FiTrendingUp" className="text-gray-400" />
          <h2 className="font-semibold text-white">24-Month Capped Scaling (Profit)</h2>
        </div>
      </div>
      <div className="flex-1 min-h-[250px]">
        <ReactECharts option={options} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
}
