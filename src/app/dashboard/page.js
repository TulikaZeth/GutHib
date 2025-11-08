'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/auth/signin');
        return;
      }
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      router.push('/auth/signin');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
      }}>
        <p style={{
          color: '#ffffff',
          fontSize: '1rem',
          letterSpacing: '2px',
          fontFamily: "'Courier New', monospace",
        }}>
          LOADING...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Header */}
      <div style={{
        marginBottom: '2rem',
        padding: '2rem',
        background: '#000000',
        border: '2px solid #ffffff',
        borderLeft: '6px solid #ffffff',
        borderBottom: '6px solid #ffffff',
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: '2.5rem',
          fontWeight: 900,
          letterSpacing: '3px',
          marginBottom: '0.5rem',
          fontFamily: "'Courier New', monospace",
        }}>
          WELCOME BACK
        </h1>
        <p style={{
          color: '#999999',
          fontSize: '1.25rem',
          letterSpacing: '1px',
          margin: 0,
          fontFamily: "'Courier New', monospace",
        }}>
          {user?.name || user?.email || 'USER'}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        {[
          { label: 'ORGANIZATIONS', value: '0', icon: '🏢' },
          { label: 'ASSIGNED ISSUES', value: '0', icon: '📋' },
          { label: 'COMPLETED', value: '0', icon: '✅' },
          { label: 'IN PROGRESS', value: '0', icon: '⚙️' },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              padding: '2rem',
              background: '#000000',
              border: '2px solid #ffffff',
              borderLeft: '4px solid #ffffff',
              borderBottom: '4px solid #ffffff',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-4px, -4px)';
              e.currentTarget.style.boxShadow = '6px 6px 0 #ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              fontSize: '2rem',
              marginBottom: '1rem',
            }}>
              {stat.icon}
            </div>
            <p style={{
              color: '#999999',
              fontSize: '0.875rem',
              letterSpacing: '1px',
              marginBottom: '0.5rem',
              fontFamily: "'Courier New', monospace",
            }}>
              {stat.label}
            </p>
            <p style={{
              color: '#ffffff',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              margin: 0,
              fontFamily: "'Courier New', monospace",
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{
        padding: '2rem',
        background: '#000000',
        border: '2px solid #ffffff',
        borderLeft: '6px solid #ffffff',
        borderBottom: '6px solid #ffffff',
      }}>
        <h2 style={{
          color: '#ffffff',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          letterSpacing: '2px',
          marginBottom: '1.5rem',
          fontFamily: "'Courier New', monospace",
        }}>
          QUICK ACTIONS
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          {[
            { label: 'ADD ORGANIZATION', path: '/dashboard/add-orgs' },
            { label: 'VIEW ISSUES', path: '/dashboard/issues' },
            { label: 'EDIT PROFILE', path: '/dashboard/profile' },
            { label: 'VIEW ORGS', path: '/dashboard/orgs' },
          ].map((action, idx) => (
            <a
              key={idx}
              href={action.path}
              style={{
                display: 'block',
                padding: '1.25rem',
                background: '#ffffff',
                color: '#000000',
                textAlign: 'center',
                textDecoration: 'none',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                border: '2px solid #000000',
                borderLeft: '4px solid #000000',
                borderBottom: '4px solid #000000',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#000000';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#ffffff';
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                e.currentTarget.style.boxShadow = '4px 4px 0 #ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#000000';
                e.currentTarget.style.borderColor = '#000000';
                e.currentTarget.style.transform = 'translate(0, 0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
