'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [resume, setResume] = useState(null);
  const [techStack, setTechStack] = useState([]);
  const [interests, setInterests] = useState([]);
  const [level, setLevel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [finalAnalysis, setFinalAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if logged in, for simplicity, assume if not redirected, is logged in
    setIsLoggedIn(true);
  }, []);

  if (!isLoggedIn) {
    return <div>Loading...</div>;
  }

  const handleTechStackChange = (e) => {
    const value = e.target.value;
    setTechStack(prev => prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]);
  };

  const handleInterestsChange = (e) => {
    const value = e.target.value;
    setInterests(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAnalysisStatus('Analyzing your profile...');

    try {
      // 1. Analyze GitHub
      setAnalysisStatus('Analyzing GitHub profile...');
      let githubData = null;
      if (githubUsername) {
        try {
          const githubResponse = await fetch('/api/git-analyse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: githubUsername }),
          });
          if (githubResponse.ok) {
            githubData = await githubResponse.json();
          }
        } catch (error) {
          console.error('GitHub analysis failed:', error);
        }
      }

      // 2. Analyze Resume
      setAnalysisStatus('Analyzing resume...');
      let resumeData = null;
      if (resume) {
        try {
          const formData = new FormData();
          formData.append('pdf', resume);
          
          const resumeResponse = await fetch('https://gut-hib-resume-analyzer.onrender.com/extract-text', {
            method: 'POST',
            body: formData,
          });
          if (resumeResponse.ok) {
            resumeData = await resumeResponse.json();
          }
        } catch (error) {
          console.error('Resume analysis failed:', error);
        }
      }

      // 3. User Preferences
      const userPreferences = {
        techStack,
        interests,
        level,
      };

      // 4. Combine all three analyses
      setAnalysisStatus('Combining analysis...');
      const combinedAnalysis = combineAnalyses(githubData, resumeData, userPreferences);

      // Show the final analysis to user
      setFinalAnalysis(combinedAnalysis);
      setShowAnalysis(true);
      setAnalysisStatus('Review your analysis below');

      // 5. Save to database
      setAnalysisStatus('Saving profile...');
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubUsername,
          combinedAnalysis,
        }),
      });

      if (response.ok) {
        setAnalysisStatus('Complete!');
        setTimeout(() => router.push('/dashboard'), 500);
      } else {
        const error = await response.json();
        alert('Error saving data: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Error during onboarding: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const combineAnalyses = (githubData, resumeData, userPreferences) => {
    // Initialize combined structure
    const combined = {
      skills: [],
      techStack: {
        languages: [],
        frameworks: [],
        tools: [],
        libraries: [],
        databases: [],
        cloudPlatforms: [],
      },
      preferredIssues: [],
      experienceLevel: userPreferences.level || 'beginner',
    };

    // Helper to merge arrays with deduplication
    const mergeArrays = (...arrays) => {
      const allItems = arrays.flat().filter(Boolean);
      return [...new Set(allItems.map(item => typeof item === 'string' ? item.toLowerCase() : item))];
    };

    // Helper to calculate average score for skills
    const calculateSkillScores = () => {
      const skillMap = new Map();

      // Add skills from GitHub
      if (githubData?.skills) {
        githubData.skills.forEach(skill => {
          const name = skill.name || skill;
          const score = skill.score || 1;
          if (!skillMap.has(name)) {
            skillMap.set(name, { name, scores: [], sources: [] });
          }
          skillMap.get(name).scores.push(score);
          skillMap.get(name).sources.push('github');
        });
      }

      // Add skills from Resume
      if (resumeData?.skills) {
        resumeData.skills.forEach(skill => {
          const name = skill.name || skill;
          const score = skill.score || 1;
          if (!skillMap.has(name)) {
            skillMap.set(name, { name, scores: [], sources: [] });
          }
          skillMap.get(name).scores.push(score);
          skillMap.get(name).sources.push('resume');
        });
      }

      // Add skills from user preferences (tech stack)
      if (userPreferences.techStack) {
        userPreferences.techStack.forEach(tech => {
          if (!skillMap.has(tech)) {
            skillMap.set(tech, { name: tech, scores: [], sources: [] });
          }
          skillMap.get(tech).scores.push(1);
          skillMap.get(tech).sources.push('preference');
        });
      }

      // Calculate average scores
      return Array.from(skillMap.values()).map(skill => ({
        name: skill.name,
        score: skill.scores.reduce((a, b) => a + b, 0) / skill.scores.length,
        sources: skill.sources,
      }));
    };

    // Combine skills with averaged scores
    combined.skills = calculateSkillScores();

    // Combine tech stacks
    combined.techStack.languages = mergeArrays(
      githubData?.techStack?.languages || [],
      resumeData?.tech_stack?.languages || [],
      userPreferences.techStack?.filter(t => ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust'].includes(t)) || []
    );

    combined.techStack.frameworks = mergeArrays(
      githubData?.techStack?.frameworks || [],
      resumeData?.tech_stack?.frameworks || [],
      userPreferences.techStack?.filter(t => ['React', 'Django', 'Spring', 'Express', 'Vue', 'Angular'].includes(t)) || []
    );

    combined.techStack.tools = mergeArrays(
      githubData?.techStack?.tools || [],
      resumeData?.tech_stack?.tools || [],
      []
    );

    combined.techStack.libraries = mergeArrays(
      githubData?.techStack?.libraries || [],
      resumeData?.tech_stack?.libraries || [],
      []
    );

    combined.techStack.databases = mergeArrays(
      githubData?.techStack?.databases || [],
      resumeData?.tech_stack?.databases || [],
      []
    );

    combined.techStack.cloudPlatforms = mergeArrays(
      githubData?.techStack?.cloudPlatforms || [],
      resumeData?.tech_stack?.cloud_platforms || [],
      []
    );

    // Combine preferred issues
    combined.preferredIssues = userPreferences.interests || [];

    // Add experience data if available
    if (resumeData?.experience) {
      combined.experience = resumeData.experience;
    } else if (githubData?.experience) {
      combined.experience = githubData.experience;
    }

    return combined;
  };

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ maxWidth: '600px' }}>
        <div className="auth-header">
          <h1 className="auth-title">COMPLETE PROFILE</h1>
          <p className="auth-subtitle">Setup your developer profile</p>
        </div>
        
        {isLoading && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            background: '#1a1a1a',
            border: '2px solid #ffffff',
            borderLeft: '4px solid #ffffff',
            borderBottom: '4px solid #ffffff',
          }}>
            <p style={{
              color: '#ffffff',
              fontSize: '0.875rem',
              letterSpacing: '1px',
              textAlign: 'center',
              margin: 0,
            }}>
              {analysisStatus}
            </p>
          </div>
        )}

        {showAnalysis && finalAnalysis && (
          <div style={{
            padding: '1.5rem',
            marginBottom: '1.5rem',
            background: '#000000',
            border: '2px solid #ffffff',
            borderLeft: '4px solid #ffffff',
            borderBottom: '4px solid #ffffff',
          }}>
            <h2 style={{
              color: '#ffffff',
              fontSize: '1.25rem',
              letterSpacing: '2px',
              marginBottom: '1rem',
              fontFamily: "'Courier New', monospace",
              fontWeight: 'bold',
            }}>
              YOUR ANALYSIS
            </h2>

            {/* Skills */}
            {finalAnalysis.skills && finalAnalysis.skills.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '1rem',
                  letterSpacing: '1px',
                  marginBottom: '0.75rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  TOP SKILLS
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '0.5rem',
                }}>
                  {finalAnalysis.skills.slice(0, 10).map((skill, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.5rem',
                        background: '#1a1a1a',
                        border: '1px solid #ffffff',
                        borderLeft: '3px solid #ffffff',
                        borderBottom: '3px solid #ffffff',
                      }}
                    >
                      <p style={{
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        margin: 0,
                        letterSpacing: '0.5px',
                      }}>
                        {skill.name}
                      </p>
                      <p style={{
                        color: '#999999',
                        fontSize: '0.625rem',
                        margin: '0.25rem 0 0 0',
                      }}>
                        Score: {typeof skill.score === 'number' ? skill.score.toFixed(1) : skill.score}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tech Stack */}
            {finalAnalysis.techStack && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '1rem',
                  letterSpacing: '1px',
                  marginBottom: '0.75rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  TECH STACK
                </h3>
                
                {Object.entries(finalAnalysis.techStack).map(([category, items]) => 
                  items && items.length > 0 ? (
                    <div key={category} style={{ marginBottom: '0.75rem' }}>
                      <p style={{
                        color: '#999999',
                        fontSize: '0.75rem',
                        marginBottom: '0.25rem',
                        letterSpacing: '1px',
                      }}>
                        {category.toUpperCase()}:
                      </p>
                      <p style={{
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        margin: 0,
                        letterSpacing: '0.5px',
                      }}>
                        {items.join(', ')}
                      </p>
                    </div>
                  ) : null
                )}
              </div>
            )}

            {/* Interests */}
            {finalAnalysis.preferredIssues && finalAnalysis.preferredIssues.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '1rem',
                  letterSpacing: '1px',
                  marginBottom: '0.75rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  INTERESTS
                </h3>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}>
                  {finalAnalysis.preferredIssues.map((interest, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#1a1a1a',
                        border: '1px solid #ffffff',
                        borderLeft: '3px solid #ffffff',
                        borderBottom: '3px solid #ffffff',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {finalAnalysis.experience && (
              <div>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '1rem',
                  letterSpacing: '1px',
                  marginBottom: '0.75rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  EXPERIENCE
                </h3>
                <p style={{
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  margin: 0,
                  letterSpacing: '0.5px',
                }}>
                  {finalAnalysis.experience.total_years} year(s) • {finalAnalysis.experience.confidence} confidence
                </p>
              </div>
            )}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="github" className="form-label">
              GITHUB USERNAME
            </label>
            <input
              id="github"
              name="github"
              type="text"
              required
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              className="form-input"
              placeholder="username"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="resume" className="form-label">
              RESUME PDF
            </label>
            <input
              id="resume"
              name="resume"
              type="file"
              accept=".pdf"
              onChange={(e) => setResume(e.target.files[0])}
              className="form-input"
              style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              TECH STACK
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
              {['JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'Django', 'Spring'].map(tech => (
                <label key={tech} style={{ display: 'flex', alignItems: 'center', color: '#ffffff', cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}>
                  <input
                    type="checkbox"
                    value={tech}
                    onChange={handleTechStackChange}
                    disabled={isLoading}
                    style={{ 
                      width: '18px', 
                      height: '18px', 
                      marginRight: '0.5rem',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      accentColor: '#ffffff'
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', letterSpacing: '0.5px' }}>{tech}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              INTERESTS
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
              {['Bug Fixes', 'Features', 'Documentation', 'Testing', 'UI/UX', 'Backend', 'Frontend'].map(interest => (
                <label key={interest} style={{ display: 'flex', alignItems: 'center', color: '#ffffff', cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}>
                  <input
                    type="checkbox"
                    value={interest}
                    onChange={handleInterestsChange}
                    disabled={isLoading}
                    style={{ 
                      width: '18px', 
                      height: '18px', 
                      marginRight: '0.5rem',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      accentColor: '#ffffff'
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', letterSpacing: '0.5px' }}>{interest}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="level" className="form-label">
              EXPERIENCE LEVEL
            </label>
            <select
              id="level"
              name="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              required
              className="form-input"
              style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
              disabled={isLoading}
            >
              <option value="" style={{ background: '#000000', color: '#ffffff' }}>Select Level</option>
              <option value="beginner" style={{ background: '#000000', color: '#ffffff' }}>Beginner</option>
              <option value="intermediate" style={{ background: '#000000', color: '#ffffff' }}>Intermediate</option>
              <option value="advanced" style={{ background: '#000000', color: '#ffffff' }}>Advanced</option>
            </select>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
            style={{
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'ANALYZING...' : 'COMPLETE ONBOARDING'}
          </button>
        </form>
      </div>
    </div>
  );
}