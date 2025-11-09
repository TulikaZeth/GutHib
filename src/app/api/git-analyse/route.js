import { NextResponse } from 'next/server';

/**
 * POST /api/git-analyse
 * Analyze GitHub profile and return skills, tech stack, and experience
 */
export async function POST(request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'GitHub username is required' },
        { status: 400 }
      );
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // 1. Fetch user's repositories
    const reposResponse = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=30`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!reposResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch GitHub repos' },
        { status: reposResponse.status }
      );
    }

    const repos = await reposResponse.json();

    // 2. Extract languages and topics from repos
    const languageCount = {};
    const topics = new Set();
    let totalStars = 0;
    let totalCommits = 0;

    repos.forEach(repo => {
      if (repo.language) {
        languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
      }
      if (repo.topics) {
        repo.topics.forEach(topic => topics.add(topic));
      }
      totalStars += repo.stargazers_count || 0;
    });

    // 3. Get user profile for account age
    const userResponse = await fetch(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    let yearsActive = 1;
    if (userResponse.ok) {
      const userProfile = await userResponse.json();
      const createdAt = new Date(userProfile.created_at);
      const now = new Date();
      yearsActive = Math.max(1, Math.floor((now - createdAt) / (365 * 24 * 60 * 60 * 1000)));
    }

    // 4. Use Gemini AI to analyze the data
    const analysisPrompt = `
Analyze this GitHub profile data and provide a structured analysis:

Username: ${username}
Languages used: ${Object.entries(languageCount).map(([lang, count]) => `${lang} (${count} repos)`).join(', ')}
Topics/Technologies: ${Array.from(topics).join(', ')}
Total Stars: ${totalStars}
Years Active: ${yearsActive}
Total Repos: ${repos.length}

Provide a JSON response with:
{
  "skills": [{"name": "skill_name", "score": 0-10}],
  "techStack": {
    "languages": ["lang1", "lang2"],
    "frameworks": ["framework1"],
    "tools": ["tool1"],
    "libraries": ["lib1"],
    "databases": ["db1"],
    "cloudPlatforms": ["platform1"]
  },
  "experience": {
    "total_years": number,
    "confidence": "low/medium/high",
    "source": "github"
  }
}

Return ONLY valid JSON, no explanations.
`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: analysisPrompt
            }]
          }]
        }),
      }
    );

    if (!geminiResponse.ok) {
      // Fallback to manual analysis if Gemini fails
      return NextResponse.json({
        skills: Object.entries(languageCount).map(([name, count]) => ({
          name,
          score: Math.min(10, count),
        })),
        techStack: {
          languages: Object.keys(languageCount),
          frameworks: [],
          tools: [],
          libraries: [],
          databases: [],
          cloudPlatforms: [],
        },
        experience: {
          total_years: yearsActive,
          confidence: yearsActive >= 3 ? 'high' : yearsActive >= 1 ? 'medium' : 'low',
          source: 'github',
        },
      });
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Extract JSON from response (remove markdown code blocks if present)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return NextResponse.json({
      skills: analysisResult.skills || [],
      techStack: analysisResult.techStack || {
        languages: Object.keys(languageCount),
        frameworks: [],
        tools: [],
        libraries: [],
        databases: [],
        cloudPlatforms: [],
      },
      experience: analysisResult.experience || {
        total_years: yearsActive,
        confidence: yearsActive >= 3 ? 'high' : yearsActive >= 1 ? 'medium' : 'low',
        source: 'github',
      },
    });

  } catch (error) {
    console.error('GitHub analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze GitHub profile', details: error.message },
      { status: 500 }
    );
  }
}
