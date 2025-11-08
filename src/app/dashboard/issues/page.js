'use client';

import { useEffect, useState } from 'react';

function IssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/issues/assigned');
      if (response.ok) {
        const data = await response.json();
        console.log(data)
        setIssues(data.issues || []);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
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
          ASSIGNED ISSUES
        </h1>
        <p style={{
          color: '#999999',
          fontSize: '1rem',
          letterSpacing: '1px',
          margin: 0,
          fontFamily: "'Courier New', monospace",
        }}>
          {issues.length} issue(s) assigned to you
        </p>
      </div>

      {/* Issues List */}
      {issues.length === 0 ? (
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
            NO ISSUES ASSIGNED YET
          </p>
          <p style={{
            color: '#666666',
            fontSize: '0.875rem',
            letterSpacing: '0.5px',
            marginTop: '1rem',
            fontFamily: "'Courier New', monospace",
          }}>
            Add organizations to start getting issue recommendations
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '1.5rem',
        }}>
          {issues.map((issue) => (
            <div
              key={issue.id}
              style={{
                padding: '2rem',
                background: '#000000',
                border: '2px solid #ffffff',
                borderLeft: '6px solid #00ff00',
                borderBottom: '4px solid #ffffff',
                transition: 'all 0.3s ease',
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
              {/* Issue Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    color: '#ffffff',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    marginBottom: '0.5rem',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    #{issue.issueNumber} - {issue.title}
                  </h3>
                  <p style={{
                    color: '#999999',
                    fontSize: '0.875rem',
                    letterSpacing: '0.5px',
                    fontFamily: "'Courier New', monospace",
                    margin: 0,
                  }}>
                    {issue.repository}
                  </p>
                </div>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: '#00ff00',
                  color: '#000000',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  border: '2px solid #000000',
                }}>
                  ✓ ASSIGNED
                </div>
              </div>

              {/* Issue Details */}
              <div style={{
                display: 'flex',
                gap: '2rem',
                marginBottom: '1rem',
                flexWrap: 'wrap',
              }}>
                <p style={{
                  color: '#999999',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  fontFamily: "'Courier New', monospace",
                  margin: 0,
                }}>
                  Match: {issue.matchScore}%
                </p>
                <p style={{
                  color: '#999999',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  fontFamily: "'Courier New', monospace",
                  margin: 0,
                }}>
                  Expertise: {issue.expertise?.toUpperCase() || 'N/A'}
                </p>
                <p style={{
                  color: '#999999',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  fontFamily: "'Courier New', monospace",
                  margin: 0,
                }}>
                  Est. Hours: {issue.estimatedHours || 'N/A'}
                </p>
              </div>

              {/* Required Skills */}
              {issue.requiredSkills && issue.requiredSkills.length > 0 && (
                <div style={{
                  marginBottom: '1rem',
                }}>
                  <p style={{
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    letterSpacing: '1px',
                    fontFamily: "'Courier New', monospace",
                    marginBottom: '0.5rem',
                    fontWeight: 'bold',
                  }}>
                    REQUIRED SKILLS:
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}>
                    {issue.requiredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '0.25rem 0.75rem',
                          background: '#ffffff',
                          color: '#000000',
                          fontFamily: "'Courier New', monospace",
                          fontSize: '0.7rem',
                          letterSpacing: '0.5px',
                          border: '1px solid #000000',
                        }}
                      >
                        {skill.skill} ({skill.importance}/10)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Labels */}
              {issue.labels && issue.labels.length > 0 && (
                <div style={{
                  marginBottom: '1rem',
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}>
                    {issue.labels.map((label, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '0.25rem 0.75rem',
                          background: label.color ? `#${label.color}` : '#000000',
                          color: '#ffffff',
                          fontFamily: "'Courier New', monospace",
                          fontSize: '0.7rem',
                          letterSpacing: '0.5px',
                          border: '1px solid #999999',
                          borderRadius: '4px',
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <a
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  background: '#ffffff',
                  color: '#000000',
                  textDecoration: 'none',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  border: '2px solid #000000',
                  borderLeft: '4px solid #000000',
                  borderBottom: '4px solid #000000',
                  transition: 'all 0.2s ease',
                }}
              >
                VIEW ON GITHUB →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default IssuesPage;
