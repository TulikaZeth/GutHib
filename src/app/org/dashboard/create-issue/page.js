'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateIssuePage() {
  const [repos, setRepos] = useState([]);
  const [formData, setFormData] = useState({
    repoName: '',
    title: '',
    body: '',
    labels: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      const response = await fetch('/api/org/repositories');
      const data = await response.json();

      if (response.ok) {
        setRepos(data.repositories || []);
      }
    } catch (err) {
      console.error('Failed to load repositories');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/org/issues/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          labels: formData.labels ? formData.labels.split(',').map(l => l.trim()).filter(l => l) : [],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Issue created successfully! #${data.issueNumber}`);
        setFormData({ repoName: '', title: '', body: '', labels: '' });
        
        // Redirect to repository issues page after 2 seconds
        setTimeout(() => {
          router.push(`/org/dashboard/repos/${encodeURIComponent(formData.repoName)}`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to create issue');
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
        maxWidth: '900px',
      }}>
        <h1 style={{
          color: '#000000',
          fontSize: '2rem',
          fontWeight: 900,
          letterSpacing: '2px',
          marginBottom: '0.5rem',
          fontFamily: "'Courier New', monospace",
        }}>
          CREATE NEW ISSUE
        </h1>
        <p style={{
          color: '#666666',
          fontSize: '0.875rem',
          letterSpacing: '1px',
          marginBottom: '2rem',
          fontFamily: "'Courier New', monospace",
        }}>
          Create an issue on GitHub and optionally assign it to a developer
        </p>

        {loadingRepos ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#000000',
            fontFamily: "'Courier New', monospace",
            fontSize: '1rem',
            letterSpacing: '2px',
          }}>
            LOADING REPOSITORIES...
          </div>
        ) : repos.length === 0 ? (
          <div style={{
            padding: '2rem',
            border: '2px solid #000000',
            background: '#f5f5f5',
            textAlign: 'center',
          }}>
            <p style={{
              color: '#000000',
              fontSize: '1rem',
              letterSpacing: '1px',
              marginBottom: '1.5rem',
              fontFamily: "'Courier New', monospace",
            }}>
              NO REPOSITORIES FOUND
            </p>
            <a
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
              ADD REPOSITORY FIRST
            </a>
          </div>
        ) : (
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
                SELECT REPOSITORY *
              </label>
              <select
                value={formData.repoName}
                onChange={(e) => setFormData({ ...formData, repoName: e.target.value })}
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
              >
                <option value="">-- Select Repository --</option>
                {repos.map((repo) => (
                  <option key={repo.repoName} value={repo.repoName}>
                    {repo.repoName}
                  </option>
                ))}
              </select>
            </div>

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
                ISSUE TITLE *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the issue"
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
            </div>

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
                DESCRIPTION *
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Detailed description of the issue, steps to reproduce, expected behavior, etc."
                required
                rows={8}
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
                  resize: 'vertical',
                  lineHeight: '1.6',
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
                LABELS (OPTIONAL)
              </label>
              <input
                type="text"
                value={formData.labels}
                onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
                placeholder="bug, enhancement, documentation (comma separated)"
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
                Separate multiple labels with commas
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

            <div style={{
              display: 'flex',
              gap: '1rem',
            }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
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
                {loading ? 'CREATING...' : 'CREATE ISSUE'}
              </button>
              <a
                href="/org/dashboard/repos"
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: '#ffffff',
                  color: '#000000',
                  textAlign: 'center',
                  textDecoration: 'none',
                  border: '2px solid #000000',
                  borderLeft: '4px solid #000000',
                  borderBottom: '4px solid #000000',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                CANCEL
              </a>
            </div>
          </form>
        )}

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
            AFTER CREATING THE ISSUE
          </h3>
          <ul style={{
            color: '#000000',
            fontSize: '0.875rem',
            letterSpacing: '0.5px',
            fontFamily: "'Courier New', monospace",
            lineHeight: '1.8',
            paddingLeft: '1.5rem',
          }}>
            <li>Issue will be created on GitHub repository</li>
            <li>You can assign it to a developer using AI assignment</li>
            <li>System will analyze all developers for best match</li>
            <li>AI-generated roadmap will be posted automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
