'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrgAddReposPage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/org/repositories/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Repository added successfully!');
        setRepoUrl('');
        setTimeout(() => {
          router.push('/org/dashboard/repos');
        }, 1500);
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
    <div style={{
      background: '#ffffff',
      minHeight: '80vh',
    }}>
      <div style={{
        padding: '2rem',
        border: '2px solid #000000',
        borderLeft: '6px solid #000000',
        borderBottom: '6px solid #000000',
        background: '#ffffff',
        maxWidth: '800px',
      }}>
        <h1 style={{
          color: '#000000',
          fontSize: '2rem',
          fontWeight: 900,
          letterSpacing: '2px',
          marginBottom: '2rem',
          fontFamily: "'Courier New', monospace",
        }}>
          ADD REPOSITORY
        </h1>

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
              GITHUB REPOSITORY URL
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              required
              style={{
                width: '100%',
                padding: '1rem',
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
            <p style={{
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: '#666666',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '0.5px',
            }}>
              Example: https://github.com/facebook/react
            </p>
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

          {success && (
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
              {success}
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
            }}
          >
            {loading ? 'ADDING...' : 'ADD REPOSITORY'}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          border: '2px solid #000000',
          background: '#f5f5f5',
        }}>
          <h3 style={{
            color: '#000000',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            letterSpacing: '1px',
            marginBottom: '1rem',
            fontFamily: "'Courier New', monospace",
          }}>
            WHAT HAPPENS NEXT?
          </h3>
          <ul style={{
            color: '#000000',
            fontSize: '0.875rem',
            letterSpacing: '0.5px',
            fontFamily: "'Courier New', monospace",
            lineHeight: '1.8',
            paddingLeft: '1.5rem',
          }}>
            <li>Repository will be synced with GitHub</li>
            <li>All open issues will be fetched</li>
            <li>You can assign issues to developers</li>
            <li>AI will analyze and match with developer profiles</li>
            <li>Auto-generated roadmaps will be posted</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
