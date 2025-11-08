'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function OrgLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/org/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={loading}
      style={{ 
        display: 'inline-block',
        width: '100%',
        marginTop: '1.5rem',
        padding: '1rem',
        background: loading ? '#999999' : '#000000',
        color: '#ffffff',
        border: '2px solid #ffffff',
        borderLeft: '4px solid #ffffff',
        borderBottom: '4px solid #ffffff',
        fontFamily: "'Courier New', monospace",
        fontSize: '0.875rem',
        fontWeight: 'bold',
        letterSpacing: '2px',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? 'LOGGING OUT...' : 'LOGOUT'}
    </button>
  );
}
