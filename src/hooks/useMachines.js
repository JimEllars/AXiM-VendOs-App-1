import { useState, useEffect } from 'react';
import { machineService } from '../services/machineService';

export function useMachines() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const data = await machineService.getAll();
      setMachines(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  return { machines, loading, error, refresh: fetchMachines };
}