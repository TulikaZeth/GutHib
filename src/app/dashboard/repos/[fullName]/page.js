'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function RepoDetailPage() {
  const params = useParams();
  const fullName = decodeURIComponent(params.fullName);
  
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unassigned', 'commented'

  useEffect(() => {
    if (fullName) {
      fetchIssues();
    }
  }, [fullName]);

  const fetchIssues = async () => {
    try {
      const response = await fetch(`/api/repositorydetails/${encodeURIComponent(fullName)}/issues`);
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

  const filteredIssues = issues.filter(issue => {
    if (filter === 'unassigned') return issue.state === 'open' && !issue.isAssignedToMe;
    if (filter === 'assigned') return issue.isAssignedToMe;
    if (filter === 'interested') return issue.autoCommented;
    if (filter === 'commented') return issue.commentedAt;
    return true;
  });

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
          LOADING ISSUES...
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
          {fullName}
        </h1>
        <p style={{
          color: '#999999',
          fontSize: '1rem',
          letterSpacing: '1px',
          margin: 0,
          fontFamily: "'Courier New', monospace",
        }}>
          {filteredIssues.length} issue(s) found
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap',
      }}>
        {['all', 'unassigned', 'assigned', 'interested', 'commented'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.75rem 1.5rem',
              background: filter === f ? '#ffffff' : '#000000',
              color: filter === f ? '#000000' : '#ffffff',
              border: '2px solid #ffffff',
              borderLeft: '4px solid #ffffff',
              borderBottom: '4px solid #ffffff',
              fontFamily: "'Courier New', monospace",
              fontSize: '0.875rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
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
            NO ISSUES FOUND
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '1.5rem',
        }}>
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              style={{
                padding: '2rem',
                background: '#000000',
                border: issue.isAssignedToMe ? '3px solid #00ff00' : '2px solid #ffffff',
                borderLeft: issue.matchScore >= 75 ? '6px solid #00ff00' : issue.matchScore >= 50 ? '6px solid #ffff00' : '4px solid #ffffff',
                borderBottom: '4px solid #ffffff',
                transition: 'all 0.3s ease',
                position: 'relative',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{
                      color: '#ffffff',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      margin: 0,
                      fontFamily: "'Courier New', monospace",
                    }}>
                      #{issue.issueNumber} - {issue.title}
                    </h3>
                    {issue.isAssignedToMe && (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: '#00ff00',
                        color: '#000000',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.5px',
                        border: '2px solid #000000',
                      }}>
                        ASSIGNED TO YOU
                      </span>
                    )}
                    {issue.autoCommented && (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: '#ffff00',
                        color: '#000000',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.5px',
                        border: '2px solid #000000',
                      }}>
                        COMMENTED
                      </span>
                    )}
                  </div>
                </div>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: issue.matchScore >= 75 ? '#00ff00' : issue.matchScore >= 50 ? '#ffff00' : '#ff0000',
                  color: '#000000',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  border: '2px solid #000000',
                }}>
                  {issue.matchScore}% MATCH
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
                {issue.commentedAt && (
                  <p style={{
                    color: '#00ff00',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    fontFamily: "'Courier New', monospace",
                    margin: 0,
                    fontWeight: 'bold',
                  }}>
                    ✓ COMMENTED
                  </p>
                )}
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
                          background: label.color ? `#${label.color}` : '#999999',
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

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '1rem',
              }}>
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
