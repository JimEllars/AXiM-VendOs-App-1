import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService';
import { useMachines } from './useMachines';
import { useSettings } from '../context/SettingsContext';
import { ledgerService } from '../services/ledgerService';

export function useAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { machines, loading: machinesLoading } = useMachines();
  const settingsContext = useSettings();

  const fetchMetrics = useCallback(async () => {
    if (machinesLoading || settingsContext.loading) return;
    try {
      setLoading(true);
      const data = await analyticsService.getSummaryMetrics(machines, settingsContext);
      setMetrics(data);
    } catch (err) {
      console.error('Metrics sync failed', err);
    } finally {
      setLoading(false);
    }
  }, [machines, machinesLoading, settingsContext]);

  useEffect(() => {
    fetchMetrics();

    const unsubscribe = ledgerService.subscribe(() => {
      fetchMetrics();
    });

    return () => unsubscribe();
  }, [fetchMetrics]);

  return { metrics, loading, refresh: fetchMetrics };
}
