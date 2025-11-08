'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      background: '#000000',
      borderBottom: '4px solid #ffffff',
      zIndex: 1002,
    }}>
      <div style={{
        maxWidth: '100%',
        margin: '0 auto',
        padding: '1.5rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link 
          href="/"
          style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#ffffff',
            textDecoration: 'none',
            fontFamily: "'Courier New', monospace",
            letterSpacing: '3px',
            padding: '0.5rem 1rem',
            border: '2px solid #ffffff',
            borderLeft: '4px solid #ffffff',
            borderBottom: '4px solid #ffffff',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.color = '#000000';
            e.currentTarget.style.transform = 'translate(-2px, -2px)';
            e.currentTarget.style.boxShadow = '4px 4px 0 #ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.transform = 'translate(0, 0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          GUTHUB
        </Link>

        {/* Navigation */}
        <nav style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}>
          <Link
            href="/demo"
            style={{
              color: '#ffffff',
              textDecoration: 'none',
              fontFamily: "'Courier New', monospace",
              fontSize: '0.875rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              padding: '0.75rem 1.25rem',
              border: '2px solid #ffffff',
              borderLeft: '3px solid #ffffff',
              borderBottom: '3px solid #ffffff',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#000000';
              e.currentTarget.style.transform = 'translate(-2px, -2px)';
              e.currentTarget.style.boxShadow = '3px 3px 0 #ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            DEMO
          </Link>

          <Link
            href="/auth/signin"
            style={{
              color: '#000000',
              background: '#ffffff',
              textDecoration: 'none',
              fontFamily: "'Courier New', monospace",
              fontSize: '0.875rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              padding: '0.75rem 1.25rem',
              border: '2px solid #000000',
              borderLeft: '3px solid #000000',
              borderBottom: '3px solid #000000',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#000000';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#ffffff';
              e.currentTarget.style.transform = 'translate(-2px, -2px)';
              e.currentTarget.style.boxShadow = '3px 3px 0 #ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#000000';
              e.currentTarget.style.borderColor = '#000000';
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            SIGN IN
          </Link>
        </nav>
      </div>
    </header>
  );
}
