'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = [
    { name: 'ADD REPOSITORIES', path: '/dashboard/add-repos', icon: '➕' },
    { name: 'ADDED REPOSITORIES', path: '/dashboard/repos', icon: '📁' },
    { name: 'ASSIGNED ISSUES', path: '/dashboard/issues', icon: '📋' },
    { name: 'PROFILE', path: '/dashboard/profile', icon: '👤' },
  ];

  return (
    <>
      {/* Toggle Button for Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '100px',
          left: isOpen ? '260px' : '10px',
          zIndex: 1001,
          background: '#ffffff',
          color: '#000000',
          border: '2px solid #000000',
          borderLeft: '3px solid #000000',
          borderBottom: '3px solid #000000',
          padding: '0.5rem',
          cursor: 'pointer',
          fontFamily: "'Courier New', monospace",
          fontSize: '1rem',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#000000';
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.borderColor = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#ffffff';
          e.currentTarget.style.color = '#000000';
          e.currentTarget.style.borderColor = '#000000';
        }}
      >
        {isOpen ? '◀' : '▶'}
      </button>

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: '88px',
          left: isOpen ? '0' : '-250px',
          width: '250px',
          height: 'calc(100vh - 88px)',
          background: '#000000',
          borderRight: '4px solid #ffffff',
          transition: 'left 0.3s ease',
          zIndex: 1000,
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '2rem 1rem' }}>
          {/* Sidebar Title */}
          <h2
            style={{
              color: '#ffffff',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              letterSpacing: '2px',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #ffffff',
              fontFamily: "'Courier New', monospace",
            }}
          >
            DASHBOARD
          </h2>

          {/* Menu Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    color: isActive ? '#000000' : '#ffffff',
                    background: isActive ? '#ffffff' : 'transparent',
                    textDecoration: 'none',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    border: '2px solid #ffffff',
                    borderLeft: isActive ? '4px solid #000000' : '4px solid #ffffff',
                    borderBottom: isActive ? '4px solid #000000' : '4px solid #ffffff',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#1a1a1a';
                      e.currentTarget.style.transform = 'translate(-2px, -2px)';
                      e.currentTarget.style.boxShadow = '3px 3px 0 #ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'translate(0, 0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/auth/signin';
              } catch (error) {
                console.error('Logout error:', error);
              }
            }}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: '#ffffff',
              color: '#000000',
              border: '2px solid #000000',
              borderLeft: '4px solid #000000',
              borderBottom: '4px solid #000000',
              fontFamily: "'Courier New', monospace",
              fontSize: '0.875rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginTop: '2rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ff0000';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#ff0000';
              e.currentTarget.style.transform = 'translate(-2px, -2px)';
              e.currentTarget.style.boxShadow = '3px 3px 0 #ff0000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#000000';
              e.currentTarget.style.borderColor = '#000000';
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: '80px',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: isMobile ? 'block' : 'none',
          }}
        />
      )}
    </>
  );
}
