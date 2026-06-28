import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState('ADMIN'); // 'ADMIN' or 'DRIVER'

  const toggleRole = () => {
    setRole(prev => prev === 'ADMIN' ? 'DRIVER' : 'ADMIN');
  };

  return (
    <AuthContext.Provider value={{ role, toggleRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
