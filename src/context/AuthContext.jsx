import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(() => {
    return localStorage.getItem('axim_vendos_role') || 'ADMIN';
  }); // 'ADMIN' or 'DRIVER'

  const toggleRole = () => {
    setRole(prev => {
      const newRole = prev === 'ADMIN' ? 'DRIVER' : 'ADMIN';
      localStorage.setItem('axim_vendos_role', newRole);
      return newRole;
    });
  };

  return (
    <AuthContext.Provider value={{ role, toggleRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
