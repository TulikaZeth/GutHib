import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Repository from '@/models/Repository';
import Issue from '@/models/Issue';
import User from '@/models/User';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * POST /api/repositorydetails/[fullName]/poll
 * Fetch and analyze issues for a repository
 */
export async function POST(request, { params }) {
  try {
    const { fullName } = params;
    const decodedFullName = decodeURIComponent(fullName);

    await connectDB();

    const repository = await Repository.findOne({ fullName: decodedFullName });
    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    const user = await User.findById(repository.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch issues from the repository
    const issuesResponse = await fetch(
      `https://api.github.com/repos/${decodedFullName}/issues?state=open&per_page=100`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!issuesResponse.ok) {
      throw new Error('Failed to fetch issues');
    }

    const issues = await issuesResponse.json();
    
    // Filter unassigned issues (and exclude pull requests)
    const unassignedIssues = issues.filter(
      issue => !issue.pull_request && (!issue.assignee || issue.assignees.length === 0)
    );

    let newIssuesCount = 0;
    let analyzedIssuesCount = 0;

    for (const ghIssue of unassignedIssues) {
      // Check if issue already exists in database
      const existingIssue = await Issue.findOne({
        repositoryId: repository._id,
        issueNumber: ghIssue.number,
      });

      if (!existingIssue) {
        newIssuesCount++;

        // Analyze issue with Gemini AI
        const analysis = await analyzeIssueWithGemini(ghIssue.title, ghIssue.body || '');

        // Calculate match score
        const matchScore = calculateMatchScore(user, analysis.requiredSkills);

        // Create issue in database
        const newIssue = await Issue.create({
          repositoryId: repository._id,
          userId: user._id,
          issueNumber: ghIssue.number,
          title: ghIssue.title,
          body: ghIssue.body || '',
          url: ghIssue.html_url,
          repository: repository.repoName,
          state: ghIssue.state,
          labels: ghIssue.labels.map(l => l.name),
          requiredSkills: analysis.requiredSkills,
          expertise: analysis.expertise,
          estimatedHours: analysis.estimatedHours,
          matchScore,
        });

        analyzedIssuesCount++;

        // If match score is high enough, auto-comment
        if (matchScore >= 75) {
          await autoCommentOnIssue(newIssue, user, ghIssue, decodedFullName);
        }

        // Add to tracked issues
        repository.trackedIssues.push(newIssue._id);
      }
    }

    // Update repository
    repository.lastPolled = new Date();
    repository.totalIssues = repository.trackedIssues.length;
    await repository.save();

    return NextResponse.json({
      success: true,
      newIssues: newIssuesCount,
      analyzedIssues: analyzedIssuesCount,
      totalTracked: repository.totalIssues,
    });
  } catch (error) {
    console.error('Polling error:', error);
    return NextResponse.json(
      { error: 'Failed to poll repository', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Analyze issue with Gemini AI to extract required skills and difficulty
 */
async function analyzeIssueWithGemini(title, body) {
  const prompt = `Analyze this GitHub issue and extract:
1. Required skills (list 3-7 technical skills needed)
2. Importance level for each skill (1-10)
3. Expertise level needed (beginner, intermediate, advanced, or expert)
4. Estimated hours to complete

Issue Title: ${title}

Issue Description: ${body}

Respond in JSON format:
{
  "requiredSkills": [{"skill": "React", "importance": 8}, ...],
  "expertise": "intermediate",
  "estimatedHours": 5
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
          },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

    const analysis = JSON.parse(jsonText);

    return {
      requiredSkills: analysis.requiredSkills || [],
      expertise: analysis.expertise || 'intermediate',
      estimatedHours: analysis.estimatedHours || 3,
    };
  } catch (error) {
    console.error('Gemini analysis error:', error);
    // Return default analysis on error
    return {
      requiredSkills: [{ skill: 'General Programming', importance: 5 }],
      expertise: 'intermediate',
      estimatedHours: 3,
    };
  }
}

/**
 * Calculate match score between user profile and issue requirements
 */
function calculateMatchScore(user, requiredSkills) {
  if (!requiredSkills || requiredSkills.length === 0) return 50;

  let totalImportance = 0;
  let matchedImportance = 0;

  for (const required of requiredSkills) {
    totalImportance += required.importance;

    // Check user skills
    const userSkill = user.skills?.find(
      s => s.name.toLowerCase() === required.skill.toLowerCase()
    );

    if (userSkill) {
      // Weight by both importance and user's skill score
      matchedImportance += required.importance * (userSkill.score / 100);
      continue;
    }

    // Check tech stack
    const techStackMatch = Object.values(user.techStack || {})
      .flat()
      .some(tech => tech.toLowerCase().includes(required.skill.toLowerCase()));

    if (techStackMatch) {
      matchedImportance += required.importance * 0.7; // 70% match for tech stack
    }
  }

  return Math.round((matchedImportance / totalImportance) * 100);
}

/**
 * Auto-comment on GitHub issue with personalized roadmap
 */
async function autoCommentOnIssue(issue, user, ghIssue, fullName) {
  try {
    // Generate personalized roadmap with Gemini
    const roadmapPrompt = `You are ${user.name || user.username}, a developer with these skills: ${user.skills?.map(s => s.name).join(', ')}.

Generate a professional, human-like comment for this GitHub issue explaining how you would approach solving it:

Issue: ${ghIssue.title}
Description: ${ghIssue.body || 'No description provided'}

Your comment should:
1. Be concise and professional
2. Show understanding of the issue
3. Outline your approach/roadmap (2-4 steps)
4. Mention relevant skills/experience you have
5. Sound natural and human (not AI-generated)

Keep it under 200 words.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: roadmapPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
          },
        }),
      }
    );

    const data = await response.json();
    const commentBody = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I would like to work on this issue.';

    // Post comment to GitHub
    const commentResponse = await fetch(
      `https://api.github.com/repos/${fullName}/issues/${ghIssue.number}/comments`,
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

    if (commentResponse.ok) {
      // Update issue in database
      issue.commentedAt = new Date();
      issue.commentBody = commentBody;
      issue.roadmap = commentBody; // Store roadmap
      await issue.save();
    }
  } catch (error) {
    console.error('Auto-comment error:', error);
  }
}
