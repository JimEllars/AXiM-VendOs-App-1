import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(() => {
    return localStorage.getItem('axim_vendos_role') || 'ADMIN';
  });
  const [sessionActive, setSessionActive] = useState(() => {
    return localStorage.getItem('axim_vendos_session') === 'active';
  });

  useEffect(() => {
    // Basic session hardening. If it's active in localStorage, ensure state reflects it.
    if (!sessionActive) {
       setSessionActive(true);
       localStorage.setItem('axim_vendos_session', 'active');
    }
  }, [sessionActive]);

  const toggleRole = () => {
    setRole(prev => {
      const newRole = prev === 'ADMIN' ? 'DRIVER' : 'ADMIN';
      localStorage.setItem('axim_vendos_role', newRole);
      return newRole;
    });
  };

  const logout = () => {
     setSessionActive(false);
     localStorage.removeItem('axim_vendos_session');
     localStorage.removeItem('axim_vendos_role');
     // In a real app, this would route to /login.
     // For this sprint's constraints, we keep it simple and just clear state.
  };

  return (
    <AuthContext.Provider value={{ role, toggleRole, sessionActive, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
