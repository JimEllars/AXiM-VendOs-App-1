import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('No token provided.');
        setTimeout(() => {
          window.location.href = 'https://passport.axim.us.com/login?redirect=https://vendos.axim.us.com/auth/callback';
        }, 2000);
        return;
      }

      try {
        const response = await fetch('https://passport.axim.us.com/api/v1/auth/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error('Token verification failed');
        }

        const data = await response.json();

        // Ensure user has valid role
        const validRoles = ['vendos_admin', 'route_operator', 'admin', 'super_user'];
        const hasValidRole = data.roles && data.roles.some(r => validRoles.includes(r));

        if (!hasValidRole) {
           throw new Error('Unauthorized role');
        }

        login(data);
        navigate('/');

      } catch (err) {
        console.error('Authentication Error:', err);
        setError('Authentication failed. Redirecting to login...');
        setTimeout(() => {
          window.location.href = 'https://passport.axim.us.com/login?redirect=https://vendos.axim.us.com/auth/callback';
        }, 2000);
      }
    };

    verifyToken();
  }, [token, login, navigate]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-axim-black text-white">
      <div className="flex flex-col items-center space-y-4">
        {error ? (
          <>
            <SafeIcon name="FiAlertCircle" className="text-4xl text-axim-crimson" />
            <p className="text-xl">{error}</p>
          </>
        ) : (
          <>
            <SafeIcon name="FiLoader" className="text-4xl text-axim-gold animate-spin" />
            <p className="text-xl">Authenticating with AXiM Passport...</p>
          </>
        )}
      </div>
    </div>
  );
}
