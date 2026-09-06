import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(() => {
    return localStorage.getItem('axim_vendos_role') || 'ADMIN';
  });
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('axim_vendos_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [sessionActive, setSessionActive] = useState(() => {
    return localStorage.getItem('axim_vendos_session') === 'active';
  });

  // Basic check for wildcard cookie. In a real environment, this might be HttpOnly.
  useEffect(() => {
    const checkCookie = () => {
       const cookies = document.cookie.split(';');
       const hasSessionCookie = cookies.some(c => c.trim().startsWith('axim_session='));
       // We'll trust the cookie if it exists for SSO gating
       if (hasSessionCookie && !sessionActive) {
          setSessionActive(true);
          localStorage.setItem('axim_vendos_session', 'active');
       }
    };
    checkCookie();
  }, [sessionActive]);

  const login = (userData) => {
    setSessionActive(true);
    setUser(userData);

    // Map passport roles to local roles for simplicity in UI
    let mappedRole = 'DRIVER';
    if (userData.roles && (userData.roles.includes('vendos_admin') || userData.roles.includes('admin') || userData.roles.includes('super_user'))) {
       mappedRole = 'ADMIN';
    }
    setRole(mappedRole);

    localStorage.setItem('axim_vendos_session', 'active');
    localStorage.setItem('axim_vendos_user', JSON.stringify(userData));
    localStorage.setItem('axim_vendos_role', mappedRole);
  };

  const toggleRole = () => {
    setRole(prev => {
      const newRole = prev === 'ADMIN' ? 'DRIVER' : 'ADMIN';
      localStorage.setItem('axim_vendos_role', newRole);
      return newRole;
    });
  };

  const logout = () => {
     setSessionActive(false);
     setUser(null);
     localStorage.removeItem('axim_vendos_session');
     localStorage.removeItem('axim_vendos_role');
     localStorage.removeItem('axim_vendos_user');

     // Redirect to passport logout
     window.location.href = 'https://passport.axim.us.com/logout?redirect=https://vendos.axim.us.com';
  };

  return (
    <AuthContext.Provider value={{ role, user, toggleRole, sessionActive, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
