'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      background: '#000000',
      borderTop: '4px solid #ffffff',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '3rem 2rem',
      }}>
        {/* Main Footer Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem',
        }}>
          {/* Brand Section */}
          <div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              color: '#ffffff',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '2px',
              marginBottom: '1rem',
              padding: '0.5rem 0',
              borderBottom: '3px solid #ffffff',
              width: 'fit-content',
            }}>
              GutHib
            </h3>
            <p style={{
              color: '#999999',
              fontFamily: "'Courier New', monospace",
              fontSize: '0.875rem',
              lineHeight: '1.6',
              letterSpacing: '0.5px',
            }}>
              FIND GITHUB ISSUES THAT MATCH YOUR SKILLS AND INTERESTS
            </p>
          </div>

          {/* Links Section */}
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#ffffff',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '1px',
              marginBottom: '1rem',
            }}>
              QUICK LINKS
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Home', 'Demo', 'Sign In', 'Register'].map((text, idx) => (
                <Link
                  key={idx}
                  href={text === 'Home' ? '/' : text === 'Demo' ? '/demo' : text === 'Sign In' ? '/auth/signin' : '/auth/register'}
                  style={{
                    color: '#999999',
                    textDecoration: 'none',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '0.875rem',
                    letterSpacing: '0.5px',
                    transition: 'all 0.3s ease',
                    width: 'fit-content',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.paddingLeft = '0.5rem';
                    e.currentTarget.style.borderLeft = '3px solid #ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#999999';
                    e.currentTarget.style.paddingLeft = '0';
                    e.currentTarget.style.borderLeft = 'none';
                  }}
                >
                  {text.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#ffffff',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '1px',
              marginBottom: '1rem',
            }}>
              CONNECT
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { text: 'GitHub', url: 'https://github.com' },
                { text: 'Documentation', url: '#' },
                { text: 'Support', url: '#' },
                { text: 'API', url: '#' },
              ].map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#999999',
                    textDecoration: 'none',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '0.875rem',
                    letterSpacing: '0.5px',
                    transition: 'all 0.3s ease',
                    width: 'fit-content',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.paddingLeft = '0.5rem';
                    e.currentTarget.style.borderLeft = '3px solid #ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#999999';
                    e.currentTarget.style.paddingLeft = '0';
                    e.currentTarget.style.borderLeft = 'none';
                  }}
                >
                  {item.text.toUpperCase()}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          borderTop: '2px solid #333333',
          margin: '2rem 0',
        }}></div>

        {/* Bottom Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <p style={{
            color: '#666666',
            fontFamily: "'Courier New', monospace",
            fontSize: '0.75rem',
            letterSpacing: '1px',
            margin: 0,
          }}>
            © 2025 GutHib. ALL RIGHTS RESERVED.
          </p>

          <div style={{
            display: 'flex',
            gap: '1.5rem',
          }}>
            {['PRIVACY', 'TERMS', 'COOKIES'].map((text, idx) => (
              <a
                key={idx}
                href="#"
                style={{
                  color: '#666666',
                  textDecoration: 'none',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.75rem',
                  letterSpacing: '1px',
                  transition: 'all 0.3s ease',
                  borderBottom: '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderBottomColor = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#666666';
                  e.currentTarget.style.borderBottomColor = 'transparent';
                }}
              >
                {text}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
