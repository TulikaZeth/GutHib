'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

export default function AuthDemo() {
  const { user, error, isLoading } = useUser();
  const [jwtToken, setJwtToken] = useState(null);
  const [protectedData, setProtectedData] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

  const generateToken = async () => {
    try {
      const response = await fetch('/api/auth/token');
      const data = await response.json();
      setJwtToken(data.token);
      setApiResponse({ type: 'success', message: 'JWT token generated successfully!' });
    } catch (err) {
      setApiResponse({ type: 'error', message: 'Failed to generate token' });
    }
  };

  const fetchProtectedData = async () => {
    if (!jwtToken) {
      setApiResponse({ type: 'error', message: 'Please generate a token first' });
      return;
    }

    try {
      const response = await fetch('/api/protected/profile', {
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      const data = await response.json();
      setProtectedData(data);
      setApiResponse({ type: 'success', message: 'Protected data fetched successfully!' });
    } catch (err) {
      setApiResponse({ type: 'error', message: 'Failed to fetch protected data' });
    }
  };

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1 className="auth-title loading">LOADING...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1 className="auth-title">AUTHENTICATION REQUIRED</h1>
          <p style={{ color: '#999999', marginBottom: '2rem' }}>
            Please sign in to access the demo
          </p>
          <Link href="/auth/signin" className="auth-button" style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}>
            GO TO SIGN IN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ maxWidth: '800px' }}>
        <div className="auth-header">
          <h1 className="auth-title">AUTH DEMO</h1>
          <p className="auth-subtitle">Test JWT token generation and protected API routes</p>
        </div>

        {apiResponse && (
          <div 
            className="auth-error" 
            style={{ 
              background: apiResponse.type === 'success' ? '#ffffff' : '#ffffff',
              color: '#000000',
              marginBottom: '2rem'
            }}
          >
            {apiResponse.message}
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <h2 className="form-label" style={{ marginBottom: '1rem' }}>CURRENT USER</h2>
          <div className="profile-container">
            <div className="profile-item">NAME: {user.name}</div>
            <div className="profile-item">EMAIL: {user.email}</div>
            <div className="profile-item">ID: {user.sub}</div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 className="form-label" style={{ marginBottom: '1rem' }}>STEP 1: GENERATE JWT TOKEN</h2>
          <button onClick={generateToken} className="auth-button">
            GENERATE TOKEN
          </button>
          
          {jwtToken && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#111111', 
              border: '2px solid #333333',
              borderLeft: '4px solid #333333',
              borderBottom: '4px solid #333333',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: '#00ff00'
            }}>
              {jwtToken}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 className="form-label" style={{ marginBottom: '1rem' }}>STEP 2: ACCESS PROTECTED API</h2>
          <button 
            onClick={fetchProtectedData} 
            className="auth-button-secondary"
            disabled={!jwtToken}
            style={{ opacity: jwtToken ? 1 : 0.5 }}
          >
            FETCH PROTECTED DATA
          </button>
          
          {protectedData && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#000000', 
              border: '2px solid #ffffff',
              borderLeft: '4px solid #ffffff',
              borderBottom: '4px solid #ffffff',
            }}>
              <pre style={{ 
                color: '#ffffff', 
                fontSize: '0.875rem', 
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace'
              }}>
                {JSON.stringify(protectedData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #333333' }}>
          <Link href="/" className="nav-button" style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}>
            BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
