'use client';

import { useState, useEffect } from 'react';
import OrgLogoutButton from '@/components/OrgLogoutButton';

export default function OrgProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/org/profile');
      const data = await response.json();

      if (response.ok) {
        setProfile(data.organization);
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (err) {
      setError('An error occurred while loading profile');
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

  if (error || !profile) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#000000',
        fontFamily: "'Courier New', monospace",
      }}>
        {error || 'Profile not found'}
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
          ORGANIZATION PROFILE
        </h1>

        {/* Organization Info */}
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          border: '2px solid #000000',
          background: '#f5f5f5',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{
              color: '#666666',
              fontSize: '0.75rem',
              letterSpacing: '1px',
              marginBottom: '0.5rem',
              fontFamily: "'Courier New', monospace",
            }}>
              ORGANIZATION NAME
            </p>
            <p style={{
              color: '#000000',
              fontSize: '1.125rem',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              fontFamily: "'Courier New', monospace",
            }}>
              {profile.orgName}
            </p>
          </div>

          {profile.githubOrgName && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{
                color: '#666666',
                fontSize: '0.75rem',
                letterSpacing: '1px',
                marginBottom: '0.5rem',
                fontFamily: "'Courier New', monospace",
              }}>
                GITHUB ORGANIZATION
              </p>
              <p style={{
                color: '#000000',
                fontSize: '1.125rem',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                fontFamily: "'Courier New', monospace",
              }}>
                {profile.githubOrgName}
              </p>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{
              color: '#666666',
              fontSize: '0.75rem',
              letterSpacing: '1px',
              marginBottom: '0.5rem',
              fontFamily: "'Courier New', monospace",
            }}>
              EMAIL
            </p>
            <p style={{
              color: '#000000',
              fontSize: '1.125rem',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              fontFamily: "'Courier New', monospace",
            }}>
              {profile.email}
            </p>
          </div>

          {profile.description && (
            <div>
              <p style={{
                color: '#666666',
                fontSize: '0.75rem',
                letterSpacing: '1px',
                marginBottom: '0.5rem',
                fontFamily: "'Courier New', monospace",
              }}>
                DESCRIPTION
              </p>
              <p style={{
                color: '#000000',
                fontSize: '0.875rem',
                letterSpacing: '0.5px',
                lineHeight: '1.6',
                fontFamily: "'Courier New', monospace",
              }}>
                {profile.description}
              </p>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <div style={{
            padding: '1.5rem',
            border: '2px solid #000000',
            borderLeft: '4px solid #000000',
            borderBottom: '4px solid #000000',
            background: '#ffffff',
            textAlign: 'center',
          }}>
            <p style={{
              color: '#000000',
              fontSize: '2.5rem',
              fontWeight: 900,
              marginBottom: '0.5rem',
              fontFamily: "'Courier New', monospace",
            }}>
              {profile.repositories?.length || 0}
            </p>
            <p style={{
              color: '#666666',
              fontSize: '0.875rem',
              letterSpacing: '1px',
              fontFamily: "'Courier New', monospace",
            }}>
              REPOSITORIES
            </p>
          </div>

          <div style={{
            padding: '1.5rem',
            border: '2px solid #000000',
            borderLeft: '4px solid #000000',
            borderBottom: '4px solid #000000',
            background: '#ffffff',
            textAlign: 'center',
          }}>
            <p style={{
              color: '#000000',
              fontSize: '2.5rem',
              fontWeight: 900,
              marginBottom: '0.5rem',
              fontFamily: "'Courier New', monospace",
            }}>
              {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric' })}
            </p>
            <p style={{
              color: '#666666',
              fontSize: '0.875rem',
              letterSpacing: '1px',
              fontFamily: "'Courier New', monospace",
            }}>
              MEMBER SINCE
            </p>
          </div>
        </div>

        <OrgLogoutButton />
      </div>
    </div>
  );
}
