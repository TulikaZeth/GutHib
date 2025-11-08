import { NextResponse } from 'next/server';
import { getOrgSession } from '@/lib/orgAuth';
import connectDB from '@/lib/db';
import OrgAccount from '@/models/OrgAccount';
import OrgIssueAssignment from '@/models/OrgIssueAssignment';
import User from '@/models/User';

export async function POST(request) {
  try {
    const session = await getOrgSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { repoName, issueNumber } = await request.json();

    if (!repoName || !issueNumber) {
      return NextResponse.json(
        { error: 'Repository name and issue number are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify organization owns this repo
    const orgAccount = await OrgAccount.findById(session.orgId);
    if (!orgAccount) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const repo = orgAccount.repositories.find(r => r.repoName === repoName);
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found in your organization' },
        { status: 404 }
      );
    }

    // Check if already assigned
    const existingAssignment = await OrgIssueAssignment.findOne({
      orgAccountId: session.orgId,
      repoFullName: repoName,
      issueNumber,
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Issue already assigned' },
        { status: 400 }
      );
    }

    // Fetch issue details from GitHub
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const issueResponse = await fetch(
      `https://api.github.com/repos/${repoName}/issues/${issueNumber}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!issueResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch issue from GitHub' },
        { status: 404 }
      );
    }

    const issue = await issueResponse.json();

    // Step 1: AI Analysis of the issue
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const analysisPrompt = `Analyze this GitHub issue and extract required information:

Title: ${issue.title}
Body: ${issue.body || 'No description'}
Labels: ${issue.labels.map(l => l.name).join(', ')}

Provide a JSON response with:
1. requiredSkills: Array of objects with {skill: string, importance: number (1-10)}
2. expertise: One of "beginner", "intermediate", "advanced", "expert"
3. estimatedHours: Estimated hours to complete (number)

Focus on technical skills like programming languages, frameworks, tools, etc.`;

    const aiAnalysisResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
        }),
      }
    );

    let aiAnalysis = {
      requiredSkills: [],
      expertise: 'intermediate',
      estimatedHours: 8
    };

    if (!aiAnalysisResponse.ok) {
      console.error('Gemini API error:', await aiAnalysisResponse.text());
    } else {
      try {
        const aiAnalysisData = await aiAnalysisResponse.json();
        
        // Check if response has the expected structure
        if (aiAnalysisData.candidates && aiAnalysisData.candidates.length > 0) {
          const aiAnalysisText = aiAnalysisData.candidates[0]?.content?.parts?.[0]?.text || '{}';
          
          // Parse AI response
          const jsonMatch = aiAnalysisText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiAnalysis = {
              requiredSkills: parsed.requiredSkills || [],
              expertise: parsed.expertise || 'intermediate',
              estimatedHours: parsed.estimatedHours || 8
            };
          }
        } else {
          console.warn('Gemini API returned unexpected structure:', aiAnalysisData);
        }
      } catch (e) {
        console.error('Failed to parse AI analysis:', e);
      }
    }

    // Step 2: Fetch all comments from the issue to get interested developers
    const commentsResponse = await fetch(
      `https://api.github.com/repos/${repoName}/issues/${issueNumber}/comments`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!commentsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch comments from GitHub' },
        { status: 500 }
      );
    }

    const comments = await commentsResponse.json();
    
    if (comments.length === 0) {
      return NextResponse.json(
        { error: 'No comments on this issue. Developers must comment on the issue to express interest before assignment.' },
        { status: 404 }
      );
    }

    // Extract unique usernames from comments
    const commenterUsernames = [...new Set(comments.map(comment => comment.user.login))];
    
    console.log(`Found ${commenterUsernames.length} commenters: ${commenterUsernames.join(', ')}`);

    // Check which commenters are registered in our database
    const registeredDevelopers = await User.find({
      githubUsername: { $in: commenterUsernames },
      onboardingCompleted: true
    });

    console.log(`Found ${registeredDevelopers.length} registered developers in database`);

    // For unregistered commenters, analyze them using git-analysis
    const allDevelopers = [...registeredDevelopers];
    const unregisteredUsernames = commenterUsernames.filter(
      username => !registeredDevelopers.some(dev => dev.githubUsername === username)
    );

    console.log(`Analyzing ${unregisteredUsernames.length} unregistered commenters...`);

    // Analyze unregistered developers using our internal git-analyse API
    for (const username of unregisteredUsernames) {
      try {
        console.log(`Analyzing ${username} via internal git-analyse API...`);
        
        // Call our own git-analyse API endpoint
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const gitAnalysisResponse = await fetch(`${baseUrl}/api/git-analyse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });

        if (gitAnalysisResponse.ok) {
          const analysisData = await gitAnalysisResponse.json();
          
          console.log(`Git analysis complete for ${username}`);
          
          // Convert the analysis data format to match our developer schema
          const skills = analysisData.skills?.map(skill => ({
            skill: skill.name,
            score: Math.min(100, skill.score * 10) // Convert 0-10 scale to 0-100
          })) || [];

          const techStack = analysisData.techStack || {
            languages: [],
            frameworks: [],
            tools: [],
            libraries: [],
            databases: [],
            cloudPlatforms: [],
          };

          // Determine expertise level from experience
          let expertise = 'intermediate';
          if (analysisData.experience) {
            const years = analysisData.experience.total_years || 0;
            if (years >= 5) expertise = 'expert';
            else if (years >= 3) expertise = 'advanced';
            else if (years >= 1) expertise = 'intermediate';
            else expertise = 'beginner';
          }

          // Create a temporary developer object from analysis
          const tempDeveloper = {
            _id: `temp_${username}`,
            githubUsername: username,
            name: username,
            email: null,
            skills: skills.length > 0 ? skills : [{ skill: 'GitHub Contributor', score: 60 }],
            techStack: {
              languages: techStack.languages || [],
              frameworks: techStack.frameworks || [],
              tools: techStack.tools || [],
              databases: techStack.databases || [],
            },
            expertise: expertise,
            experience: analysisData.experience?.total_years || 1,
            strengths: skills.slice(0, 5).map(s => s.skill || s.name), // Top 5 skills as strengths
            onboardingCompleted: false,
            isAnalyzed: true,
          };
          
          allDevelopers.push(tempDeveloper);
          console.log(`Successfully analyzed ${username} - Skills: ${skills.length}, Expertise: ${expertise}`);
        } else {
          const errorText = await gitAnalysisResponse.text();
          console.log(`Git analysis failed for ${username}: ${gitAnalysisResponse.status} - ${errorText}`);
          
          // Fallback: Use basic GitHub API to at least get the user
          console.log(`Using fallback GitHub API for ${username}...`);
          try {
            const ghUserResponse = await fetch(`https://api.github.com/users/${username}`, {
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
              },
            });

            if (ghUserResponse.ok) {
              const ghUser = await ghUserResponse.json();
              
              // Create minimal developer profile
              const tempDeveloper = {
                _id: `temp_${username}`,
                githubUsername: username,
                name: ghUser.name || username,
                email: ghUser.email,
                skills: [{ skill: 'GitHub Contributor', score: 50 }],
                techStack: {
                  languages: [],
                  frameworks: [],
                  tools: [],
                  databases: [],
                },
                expertise: 'intermediate',
                experience: 1,
                strengths: [],
                onboardingCompleted: false,
                isAnalyzed: true,
              };
              
              allDevelopers.push(tempDeveloper);
              console.log(`Added ${username} with basic GitHub profile (fallback)`);
            } else {
              console.log(`Failed to fetch GitHub profile for ${username}, skipping...`);
            }
          } catch (fallbackError) {
            console.error(`Fallback failed for ${username}:`, fallbackError.message);
          }
        }
      } catch (error) {
        console.error(`Error analyzing ${username}:`, error.message);
        
        // Try fallback even on error
        try {
          console.log(`Using fallback GitHub API for ${username} after error...`);
          const ghUserResponse = await fetch(`https://api.github.com/users/${username}`, {
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });

          if (ghUserResponse.ok) {
            const ghUser = await ghUserResponse.json();
            
            const tempDeveloper = {
              _id: `temp_${username}`,
              githubUsername: username,
              name: ghUser.name || username,
              email: ghUser.email,
              skills: [{ skill: 'GitHub Contributor', score: 50 }],
              techStack: {
                languages: [],
                frameworks: [],
                tools: [],
                databases: [],
              },
              expertise: 'intermediate',
              experience: 1,
              strengths: [],
              onboardingCompleted: false,
              isAnalyzed: true,
            };
            
            allDevelopers.push(tempDeveloper);
            console.log(`Added ${username} with basic GitHub profile (fallback after error)`);
          }
        } catch (fallbackError) {
          console.error(`Fallback also failed for ${username}`);
        }
      }
    }

    if (allDevelopers.length === 0) {
      return NextResponse.json(
        { error: 'No valid developers found in comments. Please ensure commenters have analyzable GitHub profiles.' },
        { status: 404 }
      );
    }

    console.log(`Total developers to evaluate: ${allDevelopers.length}`);

    // Step 3: Calculate scores for each developer
    const developerScores = [];

    for (const developer of allDevelopers) {
      // Calculate Match Score (0-100) based on skills
      let matchScore = 0;
      const requiredSkills = aiAnalysis.requiredSkills || [];
      
      if (requiredSkills.length > 0) {
        let totalImportance = 0;
        let matchedImportance = 0;

        requiredSkills.forEach(reqSkill => {
          totalImportance += reqSkill.importance;
          
          // Check in developer's skills array (handle both 'name' and 'skill' fields)
          const devSkill = developer.skills?.find(
            s => (s.skill || s.name).toLowerCase().includes(reqSkill.skill.toLowerCase()) ||
                 reqSkill.skill.toLowerCase().includes((s.skill || s.name).toLowerCase())
          );
          
          if (devSkill) {
            matchedImportance += reqSkill.importance * ((devSkill.score || devSkill.level || 50) / 100);
          }
          
          // Check in techStack
          if (developer.techStack) {
            const categories = ['languages', 'frameworks', 'tools', 'databases'];
            for (const category of categories) {
              if (developer.techStack[category]?.some(
                tech => tech.toLowerCase().includes(reqSkill.skill.toLowerCase()) ||
                        reqSkill.skill.toLowerCase().includes(tech.toLowerCase())
              )) {
                matchedImportance += reqSkill.importance * 0.7; // 70% match for tech stack
                break;
              }
            }
          }
        });

        matchScore = totalImportance > 0 ? Math.min(100, (matchedImportance / totalImportance) * 100) : 0;
      }

      // Calculate Activity Score (0-100) based on recent GitHub commits
      let activityScore = 0;
      if (developer.githubUsername) {
        try {
          const eventsResponse = await fetch(
            `https://api.github.com/users/${developer.githubUsername}/events?per_page=100`,
            {
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );

          if (eventsResponse.ok) {
            const events = await eventsResponse.json();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Count push events (commits) in last 30 days
            const recentCommits = events.filter(
              event => event.type === 'PushEvent' && new Date(event.created_at) > thirtyDaysAgo
            ).length;

            // Score: 0-5 commits = 20%, 6-15 = 50%, 16-30 = 75%, 31+ = 100%
            if (recentCommits >= 31) activityScore = 100;
            else if (recentCommits >= 16) activityScore = 75;
            else if (recentCommits >= 6) activityScore = 50;
            else activityScore = Math.min(20, recentCommits * 4);
          }
        } catch (error) {
          console.error(`Failed to get activity for ${developer.githubUsername}:`, error.message);
        }
      }

      // Calculate Workload Score (0-100) - inverse of current workload
      let workloadScore = 100; // Default for new/temporary developers
      
      // Only check workload for registered developers (skip temporary ones)
      if (!developer.isAnalyzed && developer._id && !developer._id.toString().startsWith('temp_')) {
        const activeAssignments = await OrgIssueAssignment.countDocuments({
          assignedUserId: developer._id,
          status: { $in: ['assigned', 'in_progress'] },
        });

        // Score: 0 assignments = 100%, 1 = 80%, 2 = 60%, 3 = 40%, 4 = 20%, 5+ = 0%
        workloadScore = Math.max(0, 100 - (activeAssignments * 20));
      }

      // Calculate Final Score (weighted average)
      const finalScore = (matchScore * 0.5) + (activityScore * 0.3) + (workloadScore * 0.2);

      developerScores.push({
        developer,
        matchScore: Math.round(matchScore),
        activityScore: Math.round(activityScore),
        workloadScore: Math.round(workloadScore),
        finalScore: Math.round(finalScore),
      });
    }

    // Sort by final score and get top 5 developers
    developerScores.sort((a, b) => b.finalScore - a.finalScore);
    const top5Developers = developerScores.slice(0, 5);

    if (top5Developers.length === 0) {
      return NextResponse.json(
        { error: 'No suitable developer found' },
        { status: 404 }
      );
    }

    // Fetch comments from each developer for detailed view
    const developersWithComments = await Promise.all(
      top5Developers.map(async (devScore) => {
        const developer = devScore.developer;
        
        // Get developer's comment on this issue if exists
        let developerComment = null;
        try {
          const commentsResponse = await fetch(
            `https://api.github.com/repos/${repoName}/issues/${issueNumber}/comments`,
            {
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );
          
          if (commentsResponse.ok) {
            const comments = await commentsResponse.json();
            const userComment = comments.find(
              comment => comment.user.login === developer.githubUsername
            );
            
            if (userComment) {
              developerComment = {
                body: userComment.body,
                createdAt: userComment.created_at,
                url: userComment.html_url,
              };
            }
          }
        } catch (error) {
          console.error(`Failed to fetch comments for ${developer.githubUsername}:`, error);
        }

        return {
          id: developer._id?.toString() || developer.githubUsername,
          githubUsername: developer.githubUsername,
          name: developer.name || developer.githubUsername,
          email: developer.email,
          avatar: `https://github.com/${developer.githubUsername}.png`,
          skills: developer.skills || [],
          techStack: developer.techStack || {},
          expertise: developer.expertise || 'intermediate',
          experience: developer.experience || 0,
          strengths: developer.strengths || [],
          preferredIssues: developer.preferredIssues || [],
          onboardingCompleted: developer.onboardingCompleted || false,
          scores: {
            matchScore: devScore.matchScore,
            activityScore: devScore.activityScore,
            workloadScore: devScore.workloadScore,
            finalScore: devScore.finalScore,
          },
          comment: developerComment,
        };
      })
    );

    // Return top 5 ranked developers instead of auto-assigning
    return NextResponse.json({
      success: true,
      issue: {
        number: issueNumber,
        title: issue.title,
        body: issue.body,
        url: issue.html_url,
        labels: issue.labels,
        state: issue.state,
        requiredSkills: aiAnalysis.requiredSkills,
        expertise: aiAnalysis.expertise,
        estimatedHours: aiAnalysis.estimatedHours,
      },
      topDevelopers: developersWithComments,
      message: `Found ${developersWithComments.length} matching developers. Please select one to assign.`,
    });
  } catch (error) {
    console.error('Assignment analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze developers', details: error.message },
      { status: 500 }
    );
  }
}
    const roadmapPrompt = `Generate a detailed technical roadmap for a developer to solve this GitHub issue:

Issue Title: ${issue.title}
Issue Description: ${issue.body || 'No description'}
Labels: ${issue.labels.map(l => l.name).join(', ')}

Developer Profile:
- Skills: ${bestMatch.developer.skills?.map(s => `${s.skill || s.name} (${s.score || s.level || 50}%)`).join(', ') || 'Not specified'}
- Tech Stack: ${JSON.stringify(bestMatch.developer.techStack || {})}
- Experience: ${bestMatch.developer.experience || 'Not specified'}
- Preferred Issues: ${bestMatch.developer.preferredIssues?.join(', ') || 'Not specified'}

Create a step-by-step roadmap tailored to this developer's skill level. Include:
1. Understanding the Problem
2. Prerequisites/Setup
3. Step-by-step Implementation Plan
4. Testing Strategy
5. Best Practices

Keep it concise but actionable. Format in markdown.`;

    const roadmapResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: roadmapPrompt }] }],
        }),
      }
    );

    let aiRoadmap = 'Roadmap generation failed';
    if (roadmapResponse.ok) {
      try {
        const roadmapData = await roadmapResponse.json();
        if (roadmapData.candidates && roadmapData.candidates.length > 0) {
          aiRoadmap = roadmapData.candidates[0]?.content?.parts?.[0]?.text || 'Roadmap generation failed';
        } else {
          console.error('Gemini roadmap API returned unexpected structure:', roadmapData);
          // Provide a basic roadmap if Gemini fails
          aiRoadmap = `## Implementation Steps

1. **Understand the Issue**: Review the issue description and requirements carefully
2. **Setup Environment**: Clone the repository and set up your local development environment
3. **Implement Solution**: Write code following the project's coding standards
4. **Test Thoroughly**: Test your changes to ensure they work as expected
5. **Submit PR**: Create a pull request with a clear description of your changes

Good luck! 🚀`;
        }
      } catch (e) {
        console.error('Failed to parse roadmap response:', e);
        aiRoadmap = `## Implementation Steps

1. **Understand the Issue**: Review the issue description and requirements carefully
2. **Setup Environment**: Clone the repository and set up your local development environment
3. **Implement Solution**: Write code following the project's coding standards
4. **Test Thoroughly**: Test your changes to ensure they work as expected
5. **Submit PR**: Create a pull request with a clear description of your changes

Good luck! 🚀`;
      }
    } else {
      console.error('Gemini roadmap API failed:', await roadmapResponse.text());
    }

    // Step 5: Assign the developer to the GitHub issue
    const assignResponse = await fetch(
      `https://api.github.com/repos/${repoName}/issues/${issueNumber}/assignees`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          assignees: [bestMatch.developer.githubUsername] 
        }),
      }
    );

    if (!assignResponse.ok) {
      console.error('Failed to assign on GitHub:', await assignResponse.text());
    } else {
      console.log(`Successfully assigned ${bestMatch.developer.githubUsername} to issue #${issueNumber}`);
    }

    // Step 6: Post roadmap as comment on GitHub
    const commentBody = `🤖 **AI-Powered Assignment**

This issue has been assigned to @${bestMatch.developer.githubUsername || 'developer'} by our intelligent matching system!

**Match Analysis:**
- 🎯 Skill Match: ${bestMatch.matchScore}%
- 📊 Activity Level: ${bestMatch.activityScore}%
- ⚡ Availability: ${bestMatch.workloadScore}%
- 🏆 Overall Score: ${bestMatch.finalScore}%

---

## 🗺️ Personalized Roadmap

${aiRoadmap}

---

*Generated by Guthib AI Assignment System*`;

    const commentResponse = await fetch(
      `https://api.github.com/repos/${repoName}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: commentBody }),
      }
    );

    let commentUrl = null;
    if (commentResponse.ok) {
      const commentData = await commentResponse.json();
      commentUrl = commentData.html_url;
    }

    // Step 7: Create assignment record
    const assignmentData = {
      orgAccountId: session.orgId,
      repoFullName: repoName,
      repoUrl: repo.repoUrl,
      issueNumber,
      issueTitle: issue.title,
      issueUrl: issue.html_url,
      issueBody: issue.body,
      labels: issue.labels.map(l => l.name),
      requiredSkills: aiAnalysis.requiredSkills,
      expertise: aiAnalysis.expertise,
      estimatedHours: aiAnalysis.estimatedHours,
      matchScore: bestMatch.matchScore,
      activityScore: bestMatch.activityScore,
      workloadScore: bestMatch.workloadScore,
      finalScore: bestMatch.finalScore,
      assignedUserGithub: bestMatch.developer.githubUsername || 'unknown',
      aiRoadmap,
      githubCommentUrl: commentUrl,
      commentedAt: commentUrl ? new Date() : null,
      status: 'assigned',
    };

    // Only add assignedUserId if it's a registered developer (not a temp ID)
    if (!bestMatch.developer.isAnalyzed && bestMatch.developer._id && !bestMatch.developer._id.toString().startsWith('temp_')) {
      assignmentData.assignedUserId = bestMatch.developer._id;
    }

    const assignment = await OrgIssueAssignment.create(assignmentData);

    return NextResponse.json({
      success: true,
      message: 'Issue assigned successfully',
      assignedTo: bestMatch.developer.githubUsername || bestMatch.developer.name,
      matchScore: bestMatch.matchScore,
      activityScore: bestMatch.activityScore,
      workloadScore: bestMatch.workloadScore,
      finalScore: bestMatch.finalScore,
      commentUrl,
      analysis: {
        totalDevelopersAnalyzed: developerScores.length,
        requiredSkills: aiAnalysis.requiredSkills,
        expertise: aiAnalysis.expertise,
        estimatedHours: aiAnalysis.estimatedHours,
        selectionReason: {
          skillMatch: `Matched ${bestMatch.matchScore}% of required skills`,
          activity: `${bestMatch.activityScore}% active on GitHub (recent commits)`,
          workload: `${bestMatch.workloadScore}% available (current assignments)`,
        },
        topCandidates: developerScores.slice(0, 3).map(ds => ({
          username: ds.developer.githubUsername || ds.developer.name,
          matchScore: ds.matchScore,
          activityScore: ds.activityScore,
          workloadScore: ds.workloadScore,
          finalScore: ds.finalScore,
        })),
      },
      assignment: {
        id: assignment._id,
        status: assignment.status,
      },
    });
  } catch (error) {
    console.error('Assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to assign issue', details: error.message },
      { status: 500 }
    );
  }
}
