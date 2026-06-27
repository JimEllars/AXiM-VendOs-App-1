import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';

export function useAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getSummaryMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Metrics sync failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return { metrics, loading, refresh: fetchMetrics };
}