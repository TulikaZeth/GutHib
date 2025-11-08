'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddReposPage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const extractFullName = (url) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/repositories/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        const fullName = extractFullName(repoUrl);
        if (fullName) {
          router.push(`/dashboard/repos/${encodeURIComponent(fullName)}`);
        } else {
          router.push('/dashboard/repos');
        }
      } else {
        setError(data.error || 'Failed to add repository');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
          ADD REPOSITORY
        </h1>
        <p style={{
          color: '#999999',
          fontSize: '1rem',
          letterSpacing: '1px',
          margin: 0,
          fontFamily: "'Courier New', monospace",
        }}>
          Track issues from any GitHub repository
        </p>
      </div>

      {/* Form */}
      <div style={{
        padding: '2rem',
        background: '#000000',
        border: '2px solid #ffffff',
        borderLeft: '4px solid #ffffff',
        borderBottom: '4px solid #ffffff',
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              marginBottom: '0.75rem',
              fontFamily: "'Courier New', monospace",
            }}>
              GITHUB REPOSITORY URL
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/facebook/react"
              required
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
                outline: 'none',
              }}
            />
            <p style={{
              color: '#666666',
              fontSize: '0.75rem',
              letterSpacing: '0.5px',
              marginTop: '0.5rem',
              fontFamily: "'Courier New', monospace",
            }}>
              Enter the full GitHub repository URL (e.g., https://github.com/owner/repo)
            </p>
          </div>

          {error && (
            <div style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              background: '#ff0000',
              color: '#000000',
              border: '2px solid #000000',
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
              padding: '1rem 2rem',
              background: loading ? '#666666' : '#ffffff',
              color: '#000000',
              border: '2px solid #000000',
              borderLeft: '4px solid #000000',
              borderBottom: '4px solid #000000',
              fontFamily: "'Courier New', monospace",
              fontSize: '0.875rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'ADDING REPOSITORY...' : 'ADD REPOSITORY'}
          </button>
        </form>
      </div>

      {/* Info Section */}
      <div style={{
        marginTop: '2rem',
        padding: '2rem',
        background: '#000000',
        border: '2px solid #ffffff',
        borderLeft: '4px solid #ffffff',
        borderBottom: '4px solid #ffffff',
      }}>
        <h2 style={{
          color: '#ffffff',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          letterSpacing: '2px',
          marginBottom: '1rem',
          fontFamily: "'Courier New', monospace",
        }}>
          HOW IT WORKS
        </h2>
        <ul style={{
          color: '#999999',
          fontSize: '0.875rem',
          letterSpacing: '0.5px',
          lineHeight: '1.8',
          fontFamily: "'Courier New', monospace",
        }}>
          <li>Add any public GitHub repository by pasting its URL</li>
          <li>System polls for new unassigned issues every 10 minutes</li>
          <li>AI analyzes each issue to determine required skills and difficulty</li>
          <li>You get matched with issues that fit your profile</li>
          <li>System auto-comments on high-match issues (≥75%)</li>
          <li>Track assigned issues in the "Assigned Issues" section</li>
        </ul>
      </div>
    </div>
  );
}
