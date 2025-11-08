import { NextResponse } from 'next/server';
import { getOrgSession } from '@/lib/orgAuth';
import dbConnect from '@/lib/db';
import OrgAccount from '@/models/OrgAccount';
import User from '@/models/User';

// Helper function to analyze developer using git-analysis API
async function analyzeGitHubUser(username) {
  try {
    const response = await fetch('https://gut-hib-git-analyzer.onrender.com/git-analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      console.error(`Git analysis failed for ${username}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error analyzing ${username}:`, error);
    return null;
  }
}

// Helper function to verify and enhance skills with Gemini
async function verifySkillsWithGemini(username, gitAnalysisData) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    const prompt = `Analyze this GitHub developer profile and extract their technical skills:

Username: ${username}
Languages: ${JSON.stringify(gitAnalysisData.languages || {})}
Top Repositories: ${JSON.stringify(gitAnalysisData.topRepos?.slice(0, 5) || [])}
Activity: ${gitAnalysisData.totalCommits || 0} commits, ${gitAnalysisData.totalPullRequests || 0} PRs

Extract and return a JSON object with:
1. skills: Array of technical skills (programming languages, frameworks, tools)
2. techStack: Array of technologies they work with
3. expertise: "beginner", "intermediate", "advanced", or "expert"
4. strengths: Array of 3-5 key strengths based on their activity

Be specific and focus on technical capabilities.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!geminiResponse.ok) {
      console.error('Gemini API failed for skill verification');
      return null;
    }

    const geminiData = await geminiResponse.json();
    
    if (geminiData.candidates && geminiData.candidates.length > 0) {
      const text = geminiData.candidates[0]?.content?.parts?.[0]?.text;
      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error verifying skills with Gemini:', error);
    return null;
  }
}

// Helper function to calculate match score for issue
async function calculateMatchScore(developerData, issueData) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    const prompt = `Calculate how well this developer matches this GitHub issue:

Developer Profile:
- Skills: ${JSON.stringify(developerData.skills || [])}
- Tech Stack: ${JSON.stringify(developerData.techStack || [])}
- Expertise: ${developerData.expertise || 'intermediate'}

Issue Details:
- Title: ${issueData.title}
- Body: ${issueData.body || 'No description'}
- Labels: ${issueData.labels?.map(l => l.name).join(', ') || 'None'}

Provide a JSON response with:
1. matchScore: 0-100 (how well skills match the issue requirements)
2. matchReason: Brief explanation of why this score
3. recommendation: "excellent", "good", "fair", or "poor"

Be objective and analytical.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!geminiResponse.ok) {
      return { matchScore: 50, matchReason: 'Unable to calculate precise match', recommendation: 'fair' };
    }

    const geminiData = await geminiResponse.json();
    
    if (geminiData.candidates && geminiData.candidates.length > 0) {
      const text = geminiData.candidates[0]?.content?.parts?.[0]?.text;
      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    }

    return { matchScore: 50, matchReason: 'Unable to calculate precise match', recommendation: 'fair' };
  } catch (error) {
    console.error('Error calculating match score:', error);
    return { matchScore: 50, matchReason: 'Error in calculation', recommendation: 'fair' };
  }
}

export async function POST(request) {
  try {
    console.log('===== COMMENTS API CALLED =====');
    
    const session = await getOrgSession();
    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { repoName, issueNumber } = await request.json();

    console.log(`Fetching comments for ${repoName} issue #${issueNumber}`);

    if (!repoName || !issueNumber) {
      return NextResponse.json(
        { error: 'Repository name and issue number are required' },
        { status: 400 }
      );
    }

    // Fetch all comments from GitHub
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
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
        { status: 404 }
      );
    }

    const comments = await commentsResponse.json();

    console.log(`Found ${comments.length} comments on issue #${issueNumber}`);

    if (comments.length === 0) {
      return NextResponse.json({
        success: true,
        repoName,
        issueNumber,
        issueTitle: issueData?.title || 'Unknown',
        totalComments: 0,
        uniqueCommenters: 0,
        registeredDevelopers: 0,
        analyzedDevelopers: 0,
        comments: [],
        allDevelopers: [],
        registeredDevelopersList: [],
        analyzedDevelopersList: [],
        topMatches: [],
      });
    }

    // Fetch issue details for matching
    const issueResponse = await fetch(
      `https://api.github.com/repos/${repoName}/issues/${issueNumber}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    const issueData = issueResponse.ok ? await issueResponse.json() : null;

    // Extract unique usernames from comments
    const uniqueUsernames = [...new Set(comments.map(comment => comment.user.login))];

    console.log(`Unique commenters: ${uniqueUsernames.join(', ')}`);

    // Check which commenters are developers in our database
    const developersInDb = await User.find({
      githubUsername: { $in: uniqueUsernames }
    }).select('githubUsername name email skills techStack preferredIssues');

    console.log(`Found ${developersInDb.length} registered developers in database`);

    // Create a map for quick lookup
    const developerMap = new Map();
    developersInDb.forEach(dev => {
      developerMap.set(dev.githubUsername, {
        _id: dev._id.toString(),
        githubUsername: dev.githubUsername,
        name: dev.name,
        email: dev.email,
        skills: dev.skills || [],
        techStack: dev.techStack || [],
        preferredIssues: dev.preferredIssues || [],
        expertise: 'intermediate',
        isRegistered: true,
        analyzed: false,
      });
    });

    // Analyze non-registered developers
    const unregisteredUsernames = uniqueUsernames.filter(username => !developerMap.has(username));
    
    console.log(`Analyzing ${unregisteredUsernames.length} non-registered developers...`);
    
    for (const username of unregisteredUsernames) {
      console.log(`Analyzing ${username}...`);
      
      // Step 1: Git analysis
      const gitAnalysis = await analyzeGitHubUser(username);
      
      if (gitAnalysis) {
        // Step 2: Gemini verification and enhancement
        const geminiAnalysis = await verifySkillsWithGemini(username, gitAnalysis);
        
        const developerProfile = {
          githubUsername: username,
          name: gitAnalysis.name || username,
          email: null,
          skills: geminiAnalysis?.skills || Object.keys(gitAnalysis.languages || {}).slice(0, 10),
          techStack: geminiAnalysis?.techStack || Object.keys(gitAnalysis.languages || {}).slice(0, 10),
          expertise: geminiAnalysis?.expertise || 'intermediate',
          strengths: geminiAnalysis?.strengths || [],
          gitAnalysis: {
            totalCommits: gitAnalysis.totalCommits || 0,
            totalPullRequests: gitAnalysis.totalPullRequests || 0,
            totalStars: gitAnalysis.totalStars || 0,
            languages: gitAnalysis.languages || {},
            topRepos: gitAnalysis.topRepos?.slice(0, 5) || [],
          },
          isRegistered: false,
          analyzed: true,
        };
        
        developerMap.set(username, developerProfile);
      } else {
        // Fallback for failed analysis
        developerMap.set(username, {
          githubUsername: username,
          name: username,
          email: null,
          skills: [],
          techStack: [],
          expertise: 'unknown',
          isRegistered: false,
          analyzed: false,
        });
      }
    }

    // Calculate match scores for all developers (if issue data available)
    if (issueData) {
      console.log('Calculating match scores for all commenters...');
      for (const [username, profile] of developerMap.entries()) {
        if (profile.analyzed || profile.isRegistered) {
          const matchData = await calculateMatchScore(profile, issueData);
          profile.matchScore = matchData.matchScore;
          profile.matchReason = matchData.matchReason;
          profile.recommendation = matchData.recommendation;
        }
      }
    }

    // Enrich comments with developer info
    const enrichedComments = comments.map(comment => {
      const username = comment.user.login;
      const developer = developerMap.get(username) || {
        githubUsername: username,
        isRegistered: false,
        analyzed: false,
      };
      
      return {
        id: comment.id,
        body: comment.body,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        htmlUrl: comment.html_url,
        user: {
          login: username,
          avatarUrl: comment.user.avatar_url,
          htmlUrl: comment.user.html_url,
        },
        developer,
      };
    });

    // Sort developers by match score (if available)
    const allDevelopers = Array.from(developerMap.values())
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    const registeredDevelopers = allDevelopers.filter(d => d.isRegistered);
    const analyzedDevelopers = allDevelopers.filter(d => d.analyzed);

    return NextResponse.json({
      success: true,
      repoName,
      issueNumber,
      issueTitle: issueData?.title || 'Unknown',
      totalComments: comments.length,
      uniqueCommenters: uniqueUsernames.length,
      registeredDevelopers: registeredDevelopers.length,
      analyzedDevelopers: analyzedDevelopers.length,
      comments: enrichedComments,
      allDevelopers,
      registeredDevelopersList: registeredDevelopers,
      analyzedDevelopersList: analyzedDevelopers,
      topMatches: allDevelopers.slice(0, 5), // Top 5 best matches
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
