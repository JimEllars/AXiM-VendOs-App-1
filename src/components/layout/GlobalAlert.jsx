import React, { useEffect, useState } from 'react';

export default function GlobalAlert() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const handleNetworkError = () => {
      setOffline(true);
    };

    const handleNetworkRestore = () => {
        setOffline(false);
    }

    window.addEventListener('network_error', handleNetworkError);
    window.addEventListener('network_restore', handleNetworkRestore);

    return () => {
      window.removeEventListener('network_error', handleNetworkError);
      window.removeEventListener('network_restore', handleNetworkRestore);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="absolute top-0 left-0 right-0 bg-axim-crimson text-white text-xs text-center py-1 z-50">
      System Offline: Actions will sync when connection is restored.
    </div>
  );
}
