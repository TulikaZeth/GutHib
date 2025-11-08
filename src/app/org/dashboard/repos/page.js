'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OrgReposPage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      const response = await fetch('/api/org/repositories');
      const data = await response.json();

      if (response.ok) {
        setRepos(data.repositories || []);
      } else {
        setError(data.error || 'Failed to load repositories');
      }
    } catch (err) {
      setError('An error occurred while loading repositories');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#000000',
        fontFamily: "'Courier New', monospace",
        fontSize: '1.25rem',
        letterSpacing: '2px',
      }}>
        LOADING...
      </div>
    );
  }

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
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}>
          <h1 style={{
            color: '#000000',
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '2px',
            fontFamily: "'Courier New', monospace",
          }}>
            MY REPOSITORIES
          </h1>
          <Link
            href="/org/dashboard/add-repos"
            style={{
              padding: '0.75rem 1.5rem',
              background: '#000000',
              color: '#ffffff',
              textDecoration: 'none',
              border: '2px solid #ffffff',
              borderLeft: '4px solid #ffffff',
              borderBottom: '4px solid #ffffff',
              fontFamily: "'Courier New', monospace",
              fontSize: '0.875rem',
              fontWeight: 'bold',
              letterSpacing: '1.5px',
            }}
          >
            + ADD NEW
          </Link>
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

        {repos.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            border: '2px solid #000000',
            background: '#f5f5f5',
          }}>
            <p style={{
              color: '#000000',
              fontSize: '1rem',
              letterSpacing: '1px',
              marginBottom: '1.5rem',
              fontFamily: "'Courier New', monospace",
            }}>
              NO REPOSITORIES ADDED YET
            </p>
            <Link
              href="/org/dashboard/add-repos"
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                background: '#000000',
                color: '#ffffff',
                textDecoration: 'none',
                border: '2px solid #ffffff',
                borderLeft: '4px solid #ffffff',
                borderBottom: '4px solid #ffffff',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '1.5px',
              }}
            >
              ADD YOUR FIRST REPOSITORY
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '1.5rem',
          }}>
            {repos.map((repo, index) => (
              <Link
                key={index}
                href={`/org/dashboard/repos/${encodeURIComponent(repo.repoName)}`}
                style={{
                  display: 'block',
                  padding: '1.5rem',
                  border: '2px solid #000000',
                  borderLeft: '4px solid #000000',
                  borderBottom: '4px solid #000000',
                  background: '#ffffff',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <h3 style={{
                  color: '#000000',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  marginBottom: '0.5rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  {repo.repoName}
                </h3>
                <p style={{
                  color: '#666666',
                  fontSize: '0.875rem',
                  letterSpacing: '0.5px',
                  fontFamily: "'Courier New', monospace",
                }}>
                  Added: {new Date(repo.addedAt).toLocaleDateString()}
                </p>
                <div style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  display: 'inline-block',
                  background: '#000000',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  fontFamily: "'Courier New', monospace",
                }}>
                  VIEW ISSUES →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
