import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService';
import { useMachines } from './useMachines';

export function useAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { machines, loading: machinesLoading } = useMachines();

  const fetchMetrics = useCallback(async () => {
    if (machinesLoading) return;
    try {
      setLoading(true);
      const data = await analyticsService.getSummaryMetrics(machines);
      setMetrics(data);
    } catch (err) {
      console.error('Metrics sync failed', err);
    } finally {
      setLoading(false);
    }
  }, [machines, machinesLoading]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, refresh: fetchMetrics };
}
