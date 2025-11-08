'use client';

import { useState } from 'react';

export default function AddOrgsPage() {
  const [orgUrl, setOrgUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const extractOrgName = (url) => {
    // Extract org name from GitHub URL
    // https://github.com/facebook -> facebook
    const match = url.match(/github\.com\/([^\/]+)/);
    return match ? match[1] : url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const orgName = extractOrgName(orgUrl);
      
      const response = await fetch('/api/organizations/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName, orgUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Organization added successfully! Starting to track issues...');
        setOrgUrl('');
        
        // Redirect to org details after 2 seconds
        setTimeout(() => {
          window.location.href = `/dashboard/orgs/${orgName}`;
        }, 2000);
      } else {
        setMessage(data.error || 'Failed to add organization');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
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
          fontSize: '2rem',
          fontWeight: 900,
          letterSpacing: '3px',
          marginBottom: '0.5rem',
          fontFamily: "'Courier New', monospace",
        }}>
          ADD ORGANIZATION
        </h1>
        <p style={{
          color: '#999999',
          fontSize: '1rem',
          letterSpacing: '1px',
          margin: 0,
          fontFamily: "'Courier New', monospace",
        }}>
          Add a GitHub organization to track issues
        </p>
      </div>

      {/* Form */}
      <div style={{
        padding: '2rem',
        background: '#000000',
        border: '2px solid #ffffff',
        borderLeft: '4px solid #ffffff',
        borderBottom: '4px solid #ffffff',
        maxWidth: '600px',
      }}>
        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            background: '#1a1a1a',
            border: '2px solid #ffffff',
            borderLeft: '4px solid #ffffff',
            borderBottom: '4px solid #ffffff',
          }}>
            <p style={{
              color: '#ffffff',
              fontSize: '0.875rem',
              letterSpacing: '1px',
              margin: 0,
              fontFamily: "'Courier New', monospace",
            }}>
              {message}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              marginBottom: '0.75rem',
              fontFamily: "'Courier New', monospace",
            }}>
              GITHUB ORGANIZATION URL
            </label>
            <input
              type="text"
              value={orgUrl}
              onChange={(e) => setOrgUrl(e.target.value)}
              required
              disabled={loading}
              placeholder="https://github.com/facebook"
              style={{
                width: '100%',
                padding: '1rem',
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
                borderLeft: '4px solid #ffffff',
                borderBottom: '4px solid #ffffff',
                fontSize: '1rem',
                fontFamily: "'Courier New', monospace",
                letterSpacing: '0.5px',
              }}
            />
            <p style={{
              color: '#999999',
              fontSize: '0.75rem',
              marginTop: '0.5rem',
              fontFamily: "'Courier New', monospace",
            }}>
              Enter the full GitHub organization URL
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: '#ffffff',
              color: '#000000',
              border: '2px solid #000000',
              borderLeft: '4px solid #000000',
              borderBottom: '4px solid #000000',
              fontSize: '1rem',
              fontWeight: 'bold',
              letterSpacing: '2px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: "'Courier New', monospace",
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#000000';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#ffffff';
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                e.currentTarget.style.boxShadow = '4px 4px 0 #ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#000000';
                e.currentTarget.style.borderColor = '#000000';
                e.currentTarget.style.transform = 'translate(0, 0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {loading ? 'ADDING...' : 'ADD ORGANIZATION'}
          </button>
        </form>
      </div>
    </div>
  );
}
