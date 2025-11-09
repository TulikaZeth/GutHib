'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CompleteRegistrationPage() {
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const completeRegistration = async () => {
      try {
        // Get form data from URL params
        const dataParam = searchParams.get('data');
        
        if (!dataParam) {
          setStatus('error');
          setError('Registration data not found');
          return;
        }

        const formData = JSON.parse(decodeURIComponent(dataParam));

        // Create the organization account
        const response = await fetch('/api/org/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            paymentCompleted: true,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/org/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setError(data.error || 'Registration failed');
        }
      } catch (err) {
        setStatus('error');
        setError('An error occurred. Please contact support.');
        console.error('Registration completion error:', err);
      }
    };

    completeRegistration();
  }, [searchParams, router]);

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
        padding: '3rem',
        background: '#ffffff',
        border: '2px solid #000000',
        borderLeft: '6px solid #000000',
        borderBottom: '6px solid #000000',
        textAlign: 'center',
      }}>
        {status === 'processing' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #000000',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              margin: '0 auto 2rem',
              animation: 'spin 1s linear infinite',
            }} />
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <h2 style={{
              color: '#000000',
              fontSize: '1.5rem',
              fontWeight: 900,
              letterSpacing: '2px',
              marginBottom: '1rem',
              fontFamily: "'Courier New', monospace",
            }}>
              COMPLETING REGISTRATION
            </h2>
            <p style={{
              color: '#666666',
              fontSize: '0.875rem',
              letterSpacing: '1px',
              fontFamily: "'Courier New', monospace",
            }}>
              Please wait while we set up your organization account...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#000000',
              color: '#ffffff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              fontSize: '3rem',
            }}>
              ✓
            </div>
            <h2 style={{
              color: '#000000',
              fontSize: '1.5rem',
              fontWeight: 900,
              letterSpacing: '2px',
              marginBottom: '1rem',
              fontFamily: "'Courier New', monospace",
            }}>
              REGISTRATION COMPLETE!
            </h2>
            <p style={{
              color: '#666666',
              fontSize: '0.875rem',
              letterSpacing: '1px',
              fontFamily: "'Courier New', monospace",
            }}>
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#ff4444',
              color: '#ffffff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              fontSize: '3rem',
            }}>
              ✕
            </div>
            <h2 style={{
              color: '#000000',
              fontSize: '1.5rem',
              fontWeight: 900,
              letterSpacing: '2px',
              marginBottom: '1rem',
              fontFamily: "'Courier New', monospace",
            }}>
              REGISTRATION FAILED
            </h2>
            <p style={{
              color: '#666666',
              fontSize: '0.875rem',
              letterSpacing: '1px',
              marginBottom: '2rem',
              fontFamily: "'Courier New', monospace",
            }}>
              {error}
            </p>
            <button
              onClick={() => router.push('/org/auth/register')}
              style={{
                padding: '1rem 2rem',
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
                borderLeft: '4px solid #ffffff',
                borderBottom: '4px solid #ffffff',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '2px',
                cursor: 'pointer',
              }}
            >
              TRY AGAIN
            </button>
          </>
        )}
      </div>
    </div>
  );
}
