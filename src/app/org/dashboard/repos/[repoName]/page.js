'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';

export default function OrgRepoIssuesPage({ params }) {
  const resolvedParams = use(params);
  const repoName = decodeURIComponent(resolvedParams.repoName);
  
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState({});
  const [analysisModal, setAnalysisModal] = useState(null);
  const [commentsModal, setCommentsModal] = useState(null);
  const [loadingComments, setLoadingComments] = useState({});
  const [analysisProgress, setAnalysisProgress] = useState(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await fetch(`/api/org/repositories/${encodeURIComponent(repoName)}/issues`);
      const data = await response.json();

      if (response.ok) {
        setIssues(data.issues || []);
      } else {
        setError(data.error || 'Failed to load issues');
      }
    } catch (err) {
      setError('An error occurred while loading issues');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (issueNumber) => {
    setAssigning(prev => ({ ...prev, [issueNumber]: true }));
    
    try {
      const response = await fetch('/api/org/issues/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName,
          issueNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show developer selection modal instead of auto-assigning
        setAnalysisModal(data);
      } else {
        alert(`Failed to get developers: ${data.error}`);
      }
    } catch (err) {
      alert('An error occurred while fetching developers');
    } finally {
      setAssigning(prev => ({ ...prev, [issueNumber]: false }));
    }
  };

  const handleSelectDeveloper = async (developer) => {
    setAssigning(prev => ({ ...prev, [analysisModal.issue.number]: true }));
    
    try {
      const response = await fetch('/api/org/issues/assign-developer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName,
          issueNumber: analysisModal.issue.number,
          developerId: developer.id,
          developerUsername: developer.githubUsername,
          matchScore: developer.scores.matchScore,
          activityScore: developer.scores.activityScore,
          workloadScore: developer.scores.workloadScore,
          finalScore: developer.scores.finalScore,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isRecommendation) {
          alert(`✅ Recommended @${developer.githubUsername}!\n\n⚠️ ${data.warning}\n\nA comment has been posted to the issue with the recommendation and roadmap.`);
        } else {
          alert(`✅ Successfully assigned to @${developer.githubUsername}!`);
        }
        setAnalysisModal(null);
        // Refresh issues list
        await fetchIssues();
      } else {
        console.error('Assignment failed:', data);
        alert(`❌ Failed to assign: ${data.error}\n${data.details || ''}\nStatus: ${data.status || response.status}`);
      }
    } catch (err) {
      console.error('Assignment error:', err);
      alert(`❌ An error occurred while assigning the issue: ${err.message}`);
    } finally {
      setAssigning(prev => ({ ...prev, [analysisModal.issue.number]: false }));
    }
  };

  const handleCheckComments = async (issueNumber) => {
    setLoadingComments(prev => ({ ...prev, [issueNumber]: true }));
    setAnalysisProgress({
      issueNumber,
      stage: 'fetching',
      message: 'Fetching comments from GitHub...',
      details: [],
    });
    
    try {
      // Simulate progress updates
      setTimeout(() => {
        setAnalysisProgress(prev => prev ? {
          ...prev,
          stage: 'analyzing',
          message: 'Analyzing commenters...',
          details: ['Checking database for registered developers', 'Identifying unregistered users'],
        } : null);
      }, 1000);

      setTimeout(() => {
        setAnalysisProgress(prev => prev ? {
          ...prev,
          stage: 'git-analysis',
          message: 'Running GitHub profile analysis...',
          details: ['Fetching commit history', 'Analyzing repositories', 'Extracting languages and tech stack'],
        } : null);
      }, 2000);

      setTimeout(() => {
        setAnalysisProgress(prev => prev ? {
          ...prev,
          stage: 'gemini',
          message: 'AI skill verification in progress...',
          details: ['Gemini analyzing developer profiles', 'Extracting technical skills', 'Calculating match scores'],
        } : null);
      }, 4000);

      const response = await fetch('/api/org/issues/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName,
          issueNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisProgress({
          stage: 'complete',
          message: 'Analysis complete!',
          details: [
            `Found ${data.totalComments} comments`,
            `${data.registeredDevelopers} registered developers`,
            `${data.analyzedDevelopers || 0} developers analyzed`,
          ],
        });

        setTimeout(() => {
          setAnalysisProgress(null);
          setCommentsModal(data);
        }, 1500);
      } else {
        setAnalysisProgress(null);
        alert(`Failed to fetch comments: ${data.error}`);
      }
    } catch (err) {
      setAnalysisProgress(null);
      alert('An error occurred while fetching comments');
    } finally {
      setLoadingComments(prev => ({ ...prev, [issueNumber]: false }));
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
        LOADING ISSUES...
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
          marginBottom: '0.5rem',
          fontFamily: "'Courier New', monospace",
        }}>
          {repoName}
        </h1>
        <p style={{
          color: '#666666',
          fontSize: '0.875rem',
          letterSpacing: '1px',
          marginBottom: '2rem',
          fontFamily: "'Courier New', monospace",
        }}>
          REPOSITORY ISSUES
        </p>

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

        {issues.length === 0 ? (
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
              NO OPEN ISSUES FOUND
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '1.5rem',
          }}>
            {issues.map((issue) => (
              <div
                key={issue.number}
                style={{
                  padding: '1.5rem',
                  border: '2px solid #000000',
                  borderLeft: '4px solid #000000',
                  borderBottom: '4px solid #000000',
                  background: issue.assignedTo ? '#f0f0f0' : '#ffffff',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '0.5rem',
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
                        #{issue.number}
                      </span>
                      {issue.assignedTo && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: '#000000',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          letterSpacing: '1px',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          ASSIGNED TO: {issue.assignedTo}
                        </span>
                      )}
                    </div>
                    <h3 style={{
                      color: '#000000',
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px',
                      marginBottom: '0.75rem',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      {issue.title}
                    </h3>
                    {issue.labels && issue.labels.length > 0 && (
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        marginBottom: '0.75rem',
                      }}>
                        {issue.labels.map((label, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: label.color ? `#${label.color}` : '#000000',
                              color: '#ffffff',
                              border: '1px solid #000000',
                              fontSize: '0.75rem',
                              letterSpacing: '0.5px',
                              fontFamily: "'Courier New', monospace",
                              borderRadius: '4px',
                            }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <p style={{
                      color: '#666666',
                      fontSize: '0.875rem',
                      letterSpacing: '0.5px',
                      fontFamily: "'Courier New', monospace",
                      lineHeight: '1.6',
                    }}>
                      {issue.body ? (issue.body.substring(0, 200) + (issue.body.length > 200 ? '...' : '')) : 'No description'}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '1rem',
                }}>
                  <a
                    href={issue.html_url}
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
                    VIEW ON GITHUB
                  </a>
                  <button
                    onClick={() => handleCheckComments(issue.number)}
                    disabled={loadingComments[issue.number]}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: loadingComments[issue.number] ? '#999999' : '#ffffff',
                      color: '#000000',
                      border: '2px solid #000000',
                      borderLeft: '4px solid #000000',
                      borderBottom: '4px solid #000000',
                      fontFamily: "'Courier New', monospace",
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      cursor: loadingComments[issue.number] ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loadingComments[issue.number] ? 'LOADING...' : 'CHECK COMMENTS'}
                  </button>
                  {!issue.assignedTo && (
                    <button
                      onClick={() => handleAssign(issue.number)}
                      disabled={assigning[issue.number]}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: assigning[issue.number] ? '#999999' : '#000000',
                        color: '#ffffff',
                        border: '2px solid #ffffff',
                        borderLeft: '4px solid #ffffff',
                        borderBottom: '4px solid #ffffff',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        cursor: assigning[issue.number] ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {assigning[issue.number] ? 'ASSIGNING...' : 'AI ASSIGN'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Developer Selection Modal */}
      {analysisModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '2rem',
        }}
        onClick={() => setAnalysisModal(null)}
        >
          <div style={{
            background: '#ffffff',
            border: '4px solid #000000',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem',
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              color: '#000000',
              fontSize: '1.5rem',
              fontWeight: 900,
              letterSpacing: '2px',
              marginBottom: '1rem',
              fontFamily: "'Courier New', monospace",
            }}>
              👥 SELECT DEVELOPER TO ASSIGN
            </h2>
            
            {/* Issue Info */}
            <div style={{
              padding: '1rem',
              background: '#f5f5f5',
              border: '2px solid #000000',
              marginBottom: '1.5rem',
            }}>
              <p style={{
                fontSize: '0.75rem',
                color: '#666666',
                letterSpacing: '1px',
                marginBottom: '0.5rem',
                fontFamily: "'Courier New', monospace",
              }}>
                ISSUE #{analysisModal.issue?.number}
              </p>
              <p style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: '#000000',
                marginBottom: '0.5rem',
                fontFamily: "'Courier New', monospace",
              }}>
                {analysisModal.issue?.title}
              </p>
              {analysisModal.issue?.requiredSkills && analysisModal.issue.requiredSkills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {analysisModal.issue.requiredSkills.slice(0, 5).map((skill, idx) => (
                    <span key={idx} style={{
                      padding: '0.25rem 0.5rem',
                      background: '#000000',
                      color: '#ffffff',
                      fontSize: '0.675rem',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      {skill.skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            
            {/* Top Developers List */}
            {analysisModal.topDevelopers && analysisModal.topDevelopers.length > 0 ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  color: '#000000',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  letterSpacing: '1.5px',
                  marginBottom: '1rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  🏆 TOP {analysisModal.topDevelopers.length} MATCHES
                </h3>
                
                {analysisModal.topDevelopers.map((dev, idx) => (
                  <div key={idx} style={{
                    padding: '1.5rem',
                    background: idx === 0 ? '#000000' : '#ffffff',
                    color: idx === 0 ? '#ffffff' : '#000000',
                    border: idx === 0 ? '4px solid #000000' : '2px solid #000000',
                    marginBottom: '1rem',
                  }}>
                    {/* Developer Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '1rem',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: idx === 0 ? '#ffffff' : '#000000',
                            color: idx === 0 ? '#000000' : '#ffffff',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            fontFamily: "'Courier New', monospace",
                          }}>
                            #{idx + 1}
                          </span>
                          <p style={{
                            fontSize: '1.125rem',
                            fontWeight: 'bold',
                            fontFamily: "'Courier New', monospace",
                          }}>
                            @{dev.githubUsername}
                          </p>
                          {dev.isRegistered && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              background: idx === 0 ? '#ffffff' : '#000000',
                              color: idx === 0 ? '#000000' : '#ffffff',
                              fontSize: '0.675rem',
                              fontWeight: 'bold',
                              fontFamily: "'Courier New', monospace",
                            }}>
                              ✓ REGISTERED
                            </span>
                          )}
                        </div>
                        {dev.name && (
                          <p style={{
                            fontSize: '0.875rem',
                            opacity: 0.8,
                            fontFamily: "'Courier New', monospace",
                          }}>
                            {dev.name} {dev.email && `• ${dev.email}`}
                          </p>
                        )}
                      </div>
                      <div style={{
                        padding: '0.5rem 1rem',
                        background: idx === 0 ? '#ffffff' : '#000000',
                        color: idx === 0 ? '#000000' : '#ffffff',
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        fontFamily: "'Courier New', monospace",
                        border: idx === 0 ? '2px solid #000000' : '2px solid #ffffff',
                      }}>
                        {dev.scores?.finalScore || 0}%
                      </div>
                    </div>

                    {/* Scores Breakdown */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '0.75rem',
                      marginBottom: '1rem',
                      padding: '0.75rem',
                      background: idx === 0 ? 'rgba(255,255,255,0.1)' : '#f5f5f5',
                      border: idx === 0 ? '1px solid rgba(255,255,255,0.3)' : '1px solid #cccccc',
                    }}>
                      <div>
                        <p style={{
                          fontSize: '0.675rem',
                          opacity: 0.7,
                          marginBottom: '0.25rem',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          SKILL MATCH
                        </p>
                        <p style={{
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          {dev.scores?.matchScore || 0}%
                        </p>
                      </div>
                      <div>
                        <p style={{
                          fontSize: '0.675rem',
                          opacity: 0.7,
                          marginBottom: '0.25rem',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          ACTIVITY
                        </p>
                        <p style={{
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          {dev.scores?.activityScore || 0}%
                        </p>
                      </div>
                      <div>
                        <p style={{
                          fontSize: '0.675rem',
                          opacity: 0.7,
                          marginBottom: '0.25rem',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          WORKLOAD
                        </p>
                        <p style={{
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          {dev.scores?.workloadScore || 0}%
                        </p>
                      </div>
                    </div>

                    {/* Skills */}
                    {dev.skills && dev.skills.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{
                          fontSize: '0.675rem',
                          opacity: 0.7,
                          letterSpacing: '1px',
                          marginBottom: '0.5rem',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          SKILLS
                        </p>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}>
                          {dev.skills.slice(0, 8).map((skill, i) => (
                            <span key={i} style={{
                              padding: '0.25rem 0.5rem',
                              border: idx === 0 ? '1px solid rgba(255,255,255,0.5)' : '1px solid #000000',
                              fontSize: '0.675rem',
                              fontFamily: "'Courier New', monospace",
                            }}>
                              {typeof skill === 'string' ? skill : skill.skill || skill.name} {typeof skill === 'object' && skill.score ? `(${skill.score}%)` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Select Button */}
                    <button
                      onClick={() => handleSelectDeveloper(dev)}
                      disabled={assigning[analysisModal.issue.number]}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: idx === 0 ? '#ffffff' : '#000000',
                        color: idx === 0 ? '#000000' : '#ffffff',
                        border: idx === 0 ? '2px solid #000000' : '2px solid #ffffff',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        cursor: assigning[analysisModal.issue.number] ? 'not-allowed' : 'pointer',
                        opacity: assigning[analysisModal.issue.number] ? 0.6 : 1,
                      }}
                    >
                      {assigning[analysisModal.issue.number] ? 'ASSIGNING...' : 'SELECT THIS DEVELOPER'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                border: '2px solid #000000',
                background: '#f5f5f5',
                marginBottom: '1.5rem',
              }}>
                <p style={{
                  color: '#666666',
                  fontFamily: "'Courier New', monospace",
                }}>
                  No matching developers found
                </p>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setAnalysisModal(null)}
              style={{
                width: '100%',
                padding: '1rem',
                background: '#ffffff',
                color: '#000000',
                border: '2px solid #000000',
                borderLeft: '4px solid #000000',
                borderBottom: '4px solid #000000',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                cursor: 'pointer',
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {commentsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '2rem',
        }}
        onClick={() => setCommentsModal(null)}
        >
          <div style={{
            background: '#ffffff',
            border: '4px solid #000000',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem',
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              color: '#000000',
              fontSize: '1.5rem',
              fontWeight: 900,
              letterSpacing: '2px',
              marginBottom: '1.5rem',
              fontFamily: "'Courier New', monospace",
            }}>
              💬 ISSUE COMMENTS ANALYSIS
            </h2>

            {/* Summary Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
              marginBottom: '2rem',
            }}>
              <div style={{
                padding: '1rem',
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  letterSpacing: '1px',
                  marginBottom: '0.5rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  TOTAL COMMENTS
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  fontFamily: "'Courier New', monospace",
                }}>
                  {commentsModal.totalComments}
                </p>
              </div>
              <div style={{
                padding: '1rem',
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  letterSpacing: '1px',
                  marginBottom: '0.5rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  UNIQUE USERS
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  fontFamily: "'Courier New', monospace",
                }}>
                  {commentsModal.uniqueCommenters}
                </p>
              </div>
              <div style={{
                padding: '1rem',
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  letterSpacing: '1px',
                  marginBottom: '0.5rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  REGISTERED DEVS
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  fontFamily: "'Courier New', monospace",
                }}>
                  {commentsModal.registeredDevelopers}
                </p>
              </div>
              <div style={{
                padding: '1rem',
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  letterSpacing: '1px',
                  marginBottom: '0.5rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  ANALYZED DEVS
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  fontFamily: "'Courier New', monospace",
                }}>
                  {commentsModal.analyzedDevelopers || 0}
                </p>
              </div>
            </div>

            {/* Top Matches Section */}
            {commentsModal.topMatches && commentsModal.topMatches.length > 0 && (
              <div style={{
                padding: '1.5rem',
                border: '2px solid #000000',
                background: '#000000',
                marginBottom: '2rem',
              }}>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  letterSpacing: '1.5px',
                  marginBottom: '1rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  🏆 TOP MATCHES FOR THIS ISSUE
                </h3>
                {commentsModal.topMatches.map((dev, idx) => (
                  <div key={idx} style={{
                    padding: '1rem',
                    background: '#ffffff',
                    border: '2px solid #000000',
                    marginBottom: idx < commentsModal.topMatches.length - 1 ? '1rem' : 0,
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '0.75rem',
                    }}>
                      <div>
                        <p style={{
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          color: '#000000',
                          fontFamily: "'Courier New', monospace",
                          marginBottom: '0.25rem',
                        }}>
                          #{idx + 1} @{dev.githubUsername}
                        </p>
                        {dev.name && dev.name !== dev.githubUsername && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#666666',
                            fontFamily: "'Courier New', monospace",
                          }}>
                            {dev.name} {dev.email && `• ${dev.email}`}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {dev.matchScore !== undefined && (
                          <span style={{
                            padding: '0.5rem 0.75rem',
                            background: '#000000',
                            color: '#ffffff',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            fontFamily: "'Courier New', monospace",
                          }}>
                            {dev.matchScore}% MATCH
                          </span>
                        )}
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: dev.isRegistered ? '#000000' : '#666666',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          {dev.isRegistered ? '✓ IN DB' : '🔍 ANALYZED'}
                        </span>
                      </div>
                    </div>

                    {dev.matchReason && (
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#666666',
                        marginBottom: '0.75rem',
                        fontFamily: "'Courier New', monospace",
                        fontStyle: 'italic',
                      }}>
                        {dev.matchReason}
                      </p>
                    )}

                    {dev.recommendation && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: dev.recommendation === 'excellent' ? '#000000' : 
                                     dev.recommendation === 'good' ? '#333333' :
                                     dev.recommendation === 'fair' ? '#666666' : '#999999',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontFamily: "'Courier New', monospace",
                          textTransform: 'uppercase',
                        }}>
                          {dev.recommendation}
                        </span>
                      </div>
                    )}
                    
                    {dev.skills && dev.skills.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#666666',
                          letterSpacing: '1px',
                          marginBottom: '0.5rem',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          SKILLS {dev.expertise && `(${dev.expertise.toUpperCase()})`}
                        </p>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}>
                          {dev.skills.slice(0, 10).map((skill, i) => (
                            <span key={i} style={{
                              padding: '0.25rem 0.5rem',
                              border: '1px solid #000000',
                              fontSize: '0.75rem',
                              fontFamily: "'Courier New', monospace",
                            }}>
                              {typeof skill === 'string' ? skill : skill.skill || skill.name} {typeof skill === 'object' && skill.score ? `(${skill.score}%)` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {dev.gitAnalysis && (
                      <div style={{
                        padding: '0.75rem',
                        background: '#f5f5f5',
                        border: '1px solid #cccccc',
                        marginTop: '0.75rem',
                      }}>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#666666',
                          letterSpacing: '1px',
                          marginBottom: '0.5rem',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          GITHUB ACTIVITY
                        </p>
                        <div style={{
                          display: 'flex',
                          gap: '1rem',
                          fontSize: '0.75rem',
                          fontFamily: "'Courier New', monospace",
                          color: '#000000',
                        }}>
                          <span>📝 {dev.gitAnalysis.totalCommits} Commits</span>
                          <span>🔀 {dev.gitAnalysis.totalPullRequests} PRs</span>
                          <span>⭐ {dev.gitAnalysis.totalStars} Stars</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Registered Developers Section */}
            {commentsModal.registeredDevelopersList && commentsModal.registeredDevelopersList.length > 0 && (
              <div style={{
                padding: '1.5rem',
                border: '2px solid #000000',
                background: '#f5f5f5',
                marginBottom: '2rem',
              }}>
                <h3 style={{
                  color: '#000000',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  letterSpacing: '1.5px',
                  marginBottom: '1rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  ✅ REGISTERED DEVELOPERS IN OUR DATABASE
                </h3>
                {commentsModal.registeredDevelopersList.map((dev, idx) => (
                  <div key={idx} style={{
                    padding: '1rem',
                    background: '#ffffff',
                    border: '2px solid #000000',
                    marginBottom: idx < commentsModal.registeredDevelopersList.length - 1 ? '1rem' : 0,
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '0.75rem',
                    }}>
                      <div>
                        <p style={{
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          color: '#000000',
                          fontFamily: "'Courier New', monospace",
                          marginBottom: '0.25rem',
                        }}>
                          @{dev.githubUsername}
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#666666',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          {dev.name} • {dev.email}
                        </p>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: '#000000',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        fontFamily: "'Courier New', monospace",
                      }}>
                        IN DB
                      </span>
                    </div>
                    
                    {dev.skills && dev.skills.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#666666',
                          letterSpacing: '1px',
                          marginBottom: '0.5rem',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          SKILLS
                        </p>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}>
                          {dev.skills.slice(0, 10).map((skill, i) => (
                            <span key={i} style={{
                              padding: '0.25rem 0.5rem',
                              border: '1px solid #000000',
                              fontSize: '0.75rem',
                              fontFamily: "'Courier New', monospace",
                            }}>
                              {typeof skill === 'string' ? skill : skill.skill || skill.name} {typeof skill === 'object' && skill.score ? `(${skill.score}%)` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {dev.techStack && dev.techStack.length > 0 && (
                      <div>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#666666',
                          letterSpacing: '1px',
                          marginBottom: '0.5rem',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          TECH STACK
                        </p>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}>
                          {dev.techStack.slice(0, 10).map((tech, i) => (
                            <span key={i} style={{
                              padding: '0.25rem 0.5rem',
                              border: '1px solid #000000',
                              fontSize: '0.75rem',
                              fontFamily: "'Courier New', monospace",
                            }}>
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* All Comments Section */}
            <div style={{
              padding: '1.5rem',
              border: '2px solid #000000',
              background: '#ffffff',
            }}>
              <h3 style={{
                color: '#000000',
                fontSize: '1rem',
                fontWeight: 'bold',
                letterSpacing: '1.5px',
                marginBottom: '1rem',
                fontFamily: "'Courier New', monospace",
              }}>
                💬 ALL COMMENTS ({commentsModal.totalComments})
              </h3>
              
              {commentsModal.comments.length === 0 ? (
                <p style={{
                  color: '#666666',
                  fontSize: '0.875rem',
                  fontFamily: "'Courier New', monospace",
                  textAlign: 'center',
                  padding: '2rem',
                }}>
                  NO COMMENTS YET
                </p>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '1rem',
                  maxHeight: '400px',
                  overflow: 'auto',
                }}>
                  {commentsModal.comments.map((comment, idx) => (
                    <div key={comment.id} style={{
                      padding: '1rem',
                      background: comment.developer.isRegistered ? '#f0f9ff' : '#f5f5f5',
                      border: comment.developer.isRegistered ? '2px solid #000000' : '1px solid #cccccc',
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}>
                          <img 
                            src={comment.user.avatarUrl} 
                            alt={comment.user.login}
                            style={{
                              width: '32px',
                              height: '32px',
                              border: '2px solid #000000',
                            }}
                          />
                          <div>
                            <a
                              href={comment.user.htmlUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                                color: '#000000',
                                textDecoration: 'none',
                                fontFamily: "'Courier New', monospace",
                              }}
                            >
                              @{comment.user.login}
                            </a>
                            <p style={{
                              fontSize: '0.75rem',
                              color: '#666666',
                              fontFamily: "'Courier New', monospace",
                            }}>
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {comment.developer.isRegistered && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: '#000000',
                            color: '#ffffff',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            fontFamily: "'Courier New', monospace",
                          }}>
                            ✓ REGISTERED
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#000000',
                        lineHeight: '1.6',
                        fontFamily: "'Courier New', monospace",
                        marginBottom: '0.5rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {comment.body.length > 300 ? comment.body.substring(0, 300) + '...' : comment.body}
                      </p>
                      <a
                        href={comment.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.75rem',
                          color: '#000000',
                          textDecoration: 'underline',
                          fontFamily: "'Courier New', monospace",
                        }}
                      >
                        VIEW FULL COMMENT ON GITHUB →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div style={{ marginTop: '1.5rem' }}>
              <button
                onClick={() => setCommentsModal(null)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#000000',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  borderLeft: '4px solid #ffffff',
                  borderBottom: '4px solid #ffffff',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Progress Modal */}
      {analysisProgress && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '2rem',
        }}>
          <div style={{
            background: '#ffffff',
            border: '4px solid #000000',
            maxWidth: '600px',
            width: '100%',
            padding: '2rem',
          }}>
            <h2 style={{
              color: '#000000',
              fontSize: '1.5rem',
              fontWeight: 900,
              letterSpacing: '2px',
              marginBottom: '2rem',
              fontFamily: "'Courier New', monospace",
              textAlign: 'center',
            }}>
              {analysisProgress.stage === 'complete' ? '✅ ANALYSIS COMPLETE' : '🔍 ANALYZING COMMENTS'}
            </h2>

            {/* Progress Stages */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '2rem',
            }}>
              {/* Stage 1: Fetching */}
              <div style={{
                padding: '1rem',
                background: analysisProgress.stage === 'fetching' ? '#000000' : 
                           ['analyzing', 'git-analysis', 'gemini', 'complete'].includes(analysisProgress.stage) ? '#e0e0e0' : '#f5f5f5',
                color: analysisProgress.stage === 'fetching' ? '#ffffff' : '#000000',
                border: '2px solid #000000',
                position: 'relative',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    {['analyzing', 'git-analysis', 'gemini', 'complete'].includes(analysisProgress.stage) ? '✓' : 
                     analysisProgress.stage === 'fetching' ? '⏳' : '⭕'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      fontFamily: "'Courier New', monospace",
                      marginBottom: '0.25rem',
                    }}>
                      STEP 1: FETCHING COMMENTS
                    </p>
                    {analysisProgress.stage === 'fetching' && (
                      <p style={{
                        fontSize: '0.75rem',
                        fontFamily: "'Courier New', monospace",
                      }}>
                        Retrieving comments from GitHub API...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stage 2: Analyzing */}
              <div style={{
                padding: '1rem',
                background: analysisProgress.stage === 'analyzing' ? '#000000' : 
                           ['git-analysis', 'gemini', 'complete'].includes(analysisProgress.stage) ? '#e0e0e0' : '#f5f5f5',
                color: analysisProgress.stage === 'analyzing' ? '#ffffff' : '#000000',
                border: '2px solid #000000',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    {['git-analysis', 'gemini', 'complete'].includes(analysisProgress.stage) ? '✓' : 
                     analysisProgress.stage === 'analyzing' ? '⏳' : '⭕'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      fontFamily: "'Courier New', monospace",
                      marginBottom: '0.25rem',
                    }}>
                      STEP 2: IDENTIFYING DEVELOPERS
                    </p>
                    {analysisProgress.stage === 'analyzing' && (
                      <div>
                        {analysisProgress.details.map((detail, idx) => (
                          <p key={idx} style={{
                            fontSize: '0.75rem',
                            fontFamily: "'Courier New', monospace",
                            marginTop: '0.25rem',
                          }}>
                            • {detail}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stage 3: Git Analysis */}
              <div style={{
                padding: '1rem',
                background: analysisProgress.stage === 'git-analysis' ? '#000000' : 
                           ['gemini', 'complete'].includes(analysisProgress.stage) ? '#e0e0e0' : '#f5f5f5',
                color: analysisProgress.stage === 'git-analysis' ? '#ffffff' : '#000000',
                border: '2px solid #000000',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    {['gemini', 'complete'].includes(analysisProgress.stage) ? '✓' : 
                     analysisProgress.stage === 'git-analysis' ? '⏳' : '⭕'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      fontFamily: "'Courier New', monospace",
                      marginBottom: '0.25rem',
                    }}>
                      STEP 3: GITHUB PROFILE ANALYSIS
                    </p>
                    {analysisProgress.stage === 'git-analysis' && (
                      <div>
                        {analysisProgress.details.map((detail, idx) => (
                          <p key={idx} style={{
                            fontSize: '0.75rem',
                            fontFamily: "'Courier New', monospace",
                            marginTop: '0.25rem',
                          }}>
                            • {detail}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stage 4: Gemini AI */}
              <div style={{
                padding: '1rem',
                background: analysisProgress.stage === 'gemini' ? '#000000' : 
                           analysisProgress.stage === 'complete' ? '#e0e0e0' : '#f5f5f5',
                color: analysisProgress.stage === 'gemini' ? '#ffffff' : '#000000',
                border: '2px solid #000000',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    {analysisProgress.stage === 'complete' ? '✓' : 
                     analysisProgress.stage === 'gemini' ? '⏳' : '⭕'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      fontFamily: "'Courier New', monospace",
                      marginBottom: '0.25rem',
                    }}>
                      STEP 4: AI SKILL VERIFICATION & MATCHING
                    </p>
                    {analysisProgress.stage === 'gemini' && (
                      <div>
                        {analysisProgress.details.map((detail, idx) => (
                          <p key={idx} style={{
                            fontSize: '0.75rem',
                            fontFamily: "'Courier New', monospace",
                            marginTop: '0.25rem',
                          }}>
                            • {detail}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Message */}
            {analysisProgress.stage === 'complete' && (
              <div style={{
                padding: '1.5rem',
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
                marginBottom: '1rem',
              }}>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  fontFamily: "'Courier New', monospace",
                  marginBottom: '1rem',
                }}>
                  ANALYSIS RESULTS:
                </p>
                {analysisProgress.details.map((detail, idx) => (
                  <p key={idx} style={{
                    fontSize: '0.875rem',
                    fontFamily: "'Courier New', monospace",
                    marginTop: '0.5rem',
                  }}>
                    ✓ {detail}
                  </p>
                ))}
              </div>
            )}

            {/* Loading Animation */}
            {analysisProgress.stage !== 'complete' && (
              <div style={{
                padding: '1rem',
                textAlign: 'center',
              }}>
                <div style={{
                  display: 'inline-block',
                  width: '100%',
                  height: '4px',
                  background: '#e0e0e0',
                  border: '1px solid #000000',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '30%',
                    background: '#000000',
                    animation: 'progress 2s ease-in-out infinite',
                  }} />
                </div>
                <p style={{
                  marginTop: '1rem',
                  color: '#666666',
                  fontSize: '0.875rem',
                  fontFamily: "'Courier New', monospace",
                  letterSpacing: '1px',
                }}>
                  PLEASE WAIT...
                </p>
              </div>
            )}
          </div>
          <style jsx>{`
            @keyframes progress {
              0% { left: -30%; }
              100% { left: 100%; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
