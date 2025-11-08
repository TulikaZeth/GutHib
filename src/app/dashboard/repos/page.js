'use client';

import { useEffect, useState } from 'react';

export default function ReposPage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      const response = await fetch('/api/repositories');
      if (response.ok) {
        const data = await response.json();
        setRepos(data.repositories || []);
      }
    } catch (error) {
      console.error('Error fetching repos:', error);
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
          ADDED REPOSITORIES
        </h1>
        <p style={{
          color: '#999999',
          fontSize: '1rem',
          letterSpacing: '1px',
          margin: 0,
          fontFamily: "'Courier New', monospace",
        }}>
          {repos.length} repository(ies) tracked
        </p>
      </div>

      {/* Repositories List */}
      {repos.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          background: '#000000',
          border: '2px solid #ffffff',
          borderLeft: '4px solid #ffffff',
          borderBottom: '4px solid #ffffff',
        }}>
          <p style={{
            color: '#999999',
            fontSize: '1rem',
            letterSpacing: '1px',
            fontFamily: "'Courier New', monospace",
          }}>
            NO REPOSITORIES ADDED YET
          </p>
          <a
            href="/dashboard/add-repos"
            style={{
              display: 'inline-block',
              marginTop: '1.5rem',
              padding: '1rem 2rem',
              background: '#ffffff',
              color: '#000000',
              textDecoration: 'none',
              fontFamily: "'Courier New', monospace",
              fontSize: '0.875rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              border: '2px solid #000000',
              borderLeft: '4px solid #000000',
              borderBottom: '4px solid #000000',
            }}
          >
            ADD YOUR FIRST REPOSITORY
          </a>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '1.5rem',
        }}>
          {repos.map((repo) => (
            <a
              key={repo.id}
              href={`/dashboard/repos/${encodeURIComponent(repo.fullName)}`}
              style={{
                display: 'block',
                padding: '2rem',
                background: '#000000',
                border: '2px solid #ffffff',
                borderLeft: '4px solid #ffffff',
                borderBottom: '4px solid #ffffff',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                cursor: 'pointer',
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
              <h3 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                letterSpacing: '2px',
                marginBottom: '1rem',
                fontFamily: "'Courier New', monospace",
              }}>
                {repo.fullName}
              </h3>
              <div style={{
                display: 'flex',
                gap: '2rem',
                marginBottom: '0.75rem',
              }}>
                <p style={{
                  color: '#999999',
                  fontSize: '0.875rem',
                  letterSpacing: '0.5px',
                  fontFamily: "'Courier New', monospace",
                  margin: 0,
                }}>
                  Issues: {repo.trackedIssues}
                </p>
                <p style={{
                  color: '#999999',
                  fontSize: '0.875rem',
                  letterSpacing: '0.5px',
                  fontFamily: "'Courier New', monospace",
                  margin: 0,
                }}>
                  Status: {repo.isActive ? 'ACTIVE' : 'INACTIVE'}
                </p>
              </div>
              <p style={{
                color: '#666666',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
                fontFamily: "'Courier New', monospace",
                margin: 0,
              }}>
                Last polled: {repo.lastPolled ? new Date(repo.lastPolled).toLocaleString() : 'Never'}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
