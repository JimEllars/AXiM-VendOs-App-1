import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { settingsService } from '../services/settingsService';

export const SettingsContext = createContext(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      await settingsService.bootstrap();
      const data = await settingsService.getAll();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (key, value) => {
    try {
      await settingsService.updateValue(key, value);
      await fetchSettings();
    } catch (err) {
      console.error('Failed to update setting', err);
      throw err;
    }
  };

  const getSettingValue = (key, defaultValue) => {
    const setting = settings.find(s => s.key === key);
    return setting ? parseFloat(setting.value) : defaultValue;
  };

  const value = { settings, loading, error, updateSetting, refresh: fetchSettings, getSettingValue };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
