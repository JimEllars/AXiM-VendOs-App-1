import React, { useEffect, useState } from 'react';

export default function GlobalAlert() {
  const [offline, setOffline] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const handleNetworkError = () => {
      setOffline(true);
    };

    const handleNetworkRestore = () => {
        setOffline(false);
        setAuthError(false);
    }

    const handleAuthError = () => {
        setAuthError(true);
    }

    window.addEventListener('network_error', handleNetworkError);
    window.addEventListener('network_restore', handleNetworkRestore);
    window.addEventListener('auth_error', handleAuthError);

    return () => {
      window.removeEventListener('network_error', handleNetworkError);
      window.removeEventListener('network_restore', handleNetworkRestore);
      window.removeEventListener('auth_error', handleAuthError);
    };
  }, []);

  if (authError) {
    return (
      <div className="absolute top-0 left-0 right-0 bg-axim-crimson text-white text-xs text-center py-1 z-50">
        Authentication Failed: Invalid or missing API Secret. Please check your configuration.
      </div>
    );
  }

  if (!offline) return null;

  return (
    <div className="absolute top-0 left-0 right-0 bg-axim-gold text-axim-black text-xs font-bold text-center py-1 z-50">
      System Offline: Actions will sync when connection is restored.
    </div>
  );
}
