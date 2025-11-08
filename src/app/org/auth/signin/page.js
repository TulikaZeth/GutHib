'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrgSignInPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/org/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/org/dashboard');
      } else {
        setError(data.error || 'Sign in failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '2rem',
          textAlign: 'center',
        }}>
          <h1 style={{
            color: '#000000',
            fontSize: '3rem',
            fontWeight: 900,
            letterSpacing: '4px',
            marginBottom: '0.5rem',
            fontFamily: "'Courier New', monospace",
          }}>
            GUTHIB
          </h1>
          <p style={{
            color: '#666666',
            fontSize: '1rem',
            letterSpacing: '2px',
            fontFamily: "'Courier New', monospace",
          }}>
            ORGANIZATION SIGN IN
          </p>
        </div>

        {/* Form Container */}
        <div style={{
          padding: '2.5rem',
          background: '#ffffff',
          border: '2px solid #000000',
          borderLeft: '6px solid #000000',
          borderBottom: '6px solid #000000',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: '#000000',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginBottom: '0.5rem',
                fontFamily: "'Courier New', monospace",
              }}>
                EMAIL
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: '#ffffff',
                  color: '#000000',
                  border: '2px solid #000000',
                  borderLeft: '4px solid #000000',
                  borderBottom: '4px solid #000000',
                  fontSize: '1rem',
                  fontFamily: "'Courier New', monospace",
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                color: '#000000',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginBottom: '0.5rem',
                fontFamily: "'Courier New', monospace",
              }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: '#ffffff',
                  color: '#000000',
                  border: '2px solid #000000',
                  borderLeft: '4px solid #000000',
                  borderBottom: '4px solid #000000',
                  fontSize: '1rem',
                  fontFamily: "'Courier New', monospace",
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '1rem',
                marginBottom: '1.5rem',
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
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
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center',
          }}>
            <a
              href="/org/auth/register"
              style={{
                color: '#666666',
                fontSize: '0.875rem',
                letterSpacing: '1px',
                textDecoration: 'underline',
                fontFamily: "'Courier New', monospace",
              }}
            >
              Don't have an account? Register
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
