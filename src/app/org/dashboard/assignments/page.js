'use client';

import { useState, useEffect } from 'react';

export default function OrgAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/org/assignments');
      const data = await response.json();

      if (response.ok) {
        setAssignments(data.assignments || []);
      } else {
        setError(data.error || 'Failed to load assignments');
      }
    } catch (err) {
      setError('An error occurred while loading assignments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = filter === 'all' 
    ? assignments 
    : assignments.filter(a => a.status === filter);

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
        <h1 style={{
          color: '#000000',
          fontSize: '2rem',
          fontWeight: 900,
          letterSpacing: '2px',
          marginBottom: '2rem',
          fontFamily: "'Courier New', monospace",
        }}>
          ISSUE ASSIGNMENTS
        </h1>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}>
          {['all', 'assigned', 'in_progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '0.75rem 1.5rem',
                background: filter === status ? '#000000' : '#ffffff',
                color: filter === status ? '#ffffff' : '#000000',
                border: '2px solid #000000',
                borderLeft: '4px solid #000000',
                borderBottom: '4px solid #000000',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
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

        {filteredAssignments.length === 0 ? (
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
              fontFamily: "'Courier New', monospace",
            }}>
              {filter === 'all' ? 'NO ASSIGNMENTS YET' : `NO ${filter.toUpperCase().replace('_', ' ')} ASSIGNMENTS`}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '1.5rem',
          }}>
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment._id}
                style={{
                  padding: '1.5rem',
                  border: '2px solid #000000',
                  borderLeft: '4px solid #000000',
                  borderBottom: '4px solid #000000',
                  background: '#ffffff',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '0.5rem',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: '#000000',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        fontFamily: "'Courier New', monospace",
                      }}>
                        {assignment.repoFullName}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: '#000000',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        fontFamily: "'Courier New', monospace",
                      }}>
                        #{assignment.issueNumber}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: assignment.status === 'completed' ? '#000000' : '#666666',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        fontFamily: "'Courier New', monospace",
                      }}>
                        {assignment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <h3 style={{
                      color: '#000000',
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px',
                      marginBottom: '0.75rem',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      {assignment.issueTitle}
                    </h3>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: '#f5f5f5',
                  border: '1px solid #000000',
                }}>
                  <div>
                    <p style={{
                      color: '#666666',
                      fontSize: '0.75rem',
                      letterSpacing: '1px',
                      marginBottom: '0.25rem',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      ASSIGNED TO
                    </p>
                    <p style={{
                      color: '#000000',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      @{assignment.assignedUserGithub}
                    </p>
                  </div>
                  <div>
                    <p style={{
                      color: '#666666',
                      fontSize: '0.75rem',
                      letterSpacing: '1px',
                      marginBottom: '0.25rem',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      SKILL MATCH
                    </p>
                    <p style={{
                      color: '#000000',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      {assignment.matchScore}%
                    </p>
                  </div>
                  <div>
                    <p style={{
                      color: '#666666',
                      fontSize: '0.75rem',
                      letterSpacing: '1px',
                      marginBottom: '0.25rem',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      ACTIVITY
                    </p>
                    <p style={{
                      color: '#000000',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      {assignment.activityScore}%
                    </p>
                  </div>
                  <div>
                    <p style={{
                      color: '#666666',
                      fontSize: '0.75rem',
                      letterSpacing: '1px',
                      marginBottom: '0.25rem',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      WORKLOAD
                    </p>
                    <p style={{
                      color: '#000000',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      {assignment.workloadScore}%
                    </p>
                  </div>
                  <div>
                    <p style={{
                      color: '#666666',
                      fontSize: '0.75rem',
                      letterSpacing: '1px',
                      marginBottom: '0.25rem',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      FINAL SCORE
                    </p>
                    <p style={{
                      color: '#000000',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      {assignment.finalScore}%
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}>
                  <a
                    href={assignment.issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#ffffff',
                      color: '#000000',
                      textDecoration: 'none',
                      border: '2px solid #000000',
                      borderLeft: '4px solid #000000',
                      borderBottom: '4px solid #000000',
                      fontFamily: "'Courier New', monospace",
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                    }}
                  >
                    VIEW ISSUE
                  </a>
                  {assignment.githubCommentUrl && (
                    <a
                      href={assignment.githubCommentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#000000',
                        color: '#ffffff',
                        textDecoration: 'none',
                        border: '2px solid #ffffff',
                        borderLeft: '4px solid #ffffff',
                        borderBottom: '4px solid #ffffff',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                      }}
                    >
                      VIEW ROADMAP
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
