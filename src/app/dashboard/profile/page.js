'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        router.push('/auth/signin');
        return;
      }
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
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
          LOADING PROFILE...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '2rem' }}>
        <p style={{ color: '#ffffff' }}>Profile not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Profile Header */}
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
          marginBottom: '1rem',
          fontFamily: "'Courier New', monospace",
        }}>
          PROFILE
        </h1>
      </div>

      {/* Basic Info */}
      <div style={{
        marginBottom: '2rem',
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
          marginBottom: '1.5rem',
          fontFamily: "'Courier New', monospace",
        }}>
          BASIC INFORMATION
        </h2>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {[
            { label: 'NAME', value: user.name },
            { label: 'EMAIL', value: user.email },
            { label: 'GITHUB USERNAME', value: user.githubUsername || 'Not set' },
            { label: 'PLAN', value: user.plan || 'FREE' },
            { label: 'STATUS', value: user.isActive ? 'ACTIVE' : 'INACTIVE' },
          ].map((field, idx) => (
            <div key={idx} style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr',
              gap: '1rem',
              padding: '1rem',
              background: '#1a1a1a',
              border: '1px solid #ffffff',
              borderLeft: '3px solid #ffffff',
            }}>
              <span style={{
                color: '#999999',
                fontSize: '0.875rem',
                letterSpacing: '1px',
                fontFamily: "'Courier New', monospace",
              }}>
                {field.label}:
              </span>
              <span style={{
                color: '#ffffff',
                fontSize: '0.875rem',
                letterSpacing: '0.5px',
                fontFamily: "'Courier New', monospace",
                wordBreak: 'break-all',
              }}>
                {field.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      {user.skills && user.skills.length > 0 && (
        <div style={{
          marginBottom: '2rem',
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
            marginBottom: '1.5rem',
            fontFamily: "'Courier New', monospace",
          }}>
            SKILLS
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            {(user.skills && Array.isArray(user.skills) ? user.skills : []).map((skill, idx) => (
              <div key={idx} style={{
                padding: '1rem',
                background: '#1a1a1a',
                border: '1px solid #ffffff',
                borderLeft: '3px solid #ffffff',
                borderBottom: '3px solid #ffffff',
              }}>
                <p style={{
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  margin: 0,
                  marginBottom: '0.5rem',
                  letterSpacing: '0.5px',
                  fontFamily: "'Courier New', monospace",
                }}>
                  {skill.name || skill}
                </p>
                {skill.score && (
                  <p style={{
                    color: '#999999',
                    fontSize: '0.75rem',
                    margin: 0,
                  }}>
                    Score: {typeof skill.score === 'number' ? skill.score.toFixed(1) : skill.score}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tech Stack */}
      {user.techStack && (
        <div style={{
          marginBottom: '2rem',
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
            marginBottom: '1.5rem',
            fontFamily: "'Courier New', monospace",
          }}>
            TECH STACK
          </h2>

          {Object.entries(user.techStack || {}).map(([category, items]) => 
            items && Array.isArray(items) && items.length > 0 ? (
              <div key={category} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  color: '#999999',
                  fontSize: '0.875rem',
                  letterSpacing: '1px',
                  marginBottom: '0.75rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  {category.toUpperCase()}
                </h3>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}>
                  {items.map((item, idx) => (
                    <span key={idx} style={{
                      padding: '0.5rem 1rem',
                      background: '#1a1a1a',
                      border: '1px solid #ffffff',
                      borderLeft: '3px solid #ffffff',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Preferred Issues */}
      {user.preferredIssues && user.preferredIssues.length > 0 && (
        <div style={{
          marginBottom: '2rem',
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
            marginBottom: '1.5rem',
            fontFamily: "'Courier New', monospace",
          }}>
            PREFERRED ISSUES
          </h2>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}>
            {(user.preferredIssues && Array.isArray(user.preferredIssues) ? user.preferredIssues : []).map((issue, idx) => (
              <span key={idx} style={{
                padding: '0.75rem 1.25rem',
                background: '#1a1a1a',
                border: '2px solid #ffffff',
                borderLeft: '3px solid #ffffff',
                borderBottom: '3px solid #ffffff',
                color: '#ffffff',
                fontSize: '0.875rem',
                letterSpacing: '0.5px',
                fontFamily: "'Courier New', monospace",
              }}>
                {issue}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
