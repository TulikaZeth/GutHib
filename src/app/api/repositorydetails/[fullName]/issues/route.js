import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import connectDB from "@/lib/db";
import User from "@/models/User";

const secret = new TextEncoder().encode(
  process.env.AUTH0_SECRET || "your-secret-key-min-32-chars-long!"
);

/**
 * GET /api/repositorydetails/[fullName]/issues
 * Get all issues for a repository
 */
export async function GET(request, { params }) {
  try {
    const { fullName } = await params;
    const decodedFullName = decodeURIComponent(fullName);

    // Get session
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);

    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    await connectDB();

    // Find user (to get github username for assignment checking)
    const user = await User.findOne({ email: payload.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get issues from GitHub API
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 500 }
      );
    }

    const issuesResponse = await fetch(
      `https://api.github.com/repos/${decodedFullName}/issues?state=all&sort=created&direction=desc&per_page=100`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!issuesResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch issues from GitHub" },
        { status: issuesResponse.status }
      );
    }

    const githubIssues = await issuesResponse.json();

    console.log(user.githubUsername, githubIssues[1]);

    // Get user's skills for match score calculation
    const userSkills = user.skills || [];
    const userTechStack = user.techStack || { languages: [], frameworks: [], tools: [], databases: [] };

    // Process issues with match scores
    const processedIssues = await Promise.all(githubIssues.map(async (issue) => {
      let matchScore = 0;
      let requiredSkills = [];
      let expertise = 'intermediate';
      let estimatedHours = 8;
      let autoCommented = false;

      // Only calculate match score if user has skills
      const isAssignedToMe = issue.assignees?.some(
        (assignee) => assignee.login === user.githubUsername
      ) || false;
      const hasAssignees = issue.assignees && issue.assignees.length > 0;

      if (userSkills.length > 0) {
        try {
          // Use Gemini AI to calculate match score directly
          const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
          const matchingPrompt = `Analyze this GitHub issue and calculate how well it matches a developer's skills.

Issue Details:
Title: ${issue.title}
Body: ${issue.body || 'No description'}
Labels: ${issue.labels.map(l => l.name).join(', ')}

Developer Profile:
Skills: ${userSkills.map(s => `${s.skill || s.name} (${s.score || s.level || 50}%)`).join(', ')}
Tech Stack: ${JSON.stringify(userTechStack)}
Experience Level: ${user.expertise || 'intermediate'}

Calculate a match percentage (0-100) based on:
- Technical skills alignment
- Experience level match
- Tech stack compatibility

Return ONLY a JSON object with this exact format:
{"matchScore": 85, "reasoning": "Brief explanation of the match"}

Be realistic - most issues should have moderate match scores unless there's a strong alignment.`;

          const matchingResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: matchingPrompt }] }],
              }),
            }
          );

          if (matchingResponse.ok) {
            try {
              const matchingData = await matchingResponse.json();
              
              if (matchingData.candidates && matchingData.candidates.length > 0) {
                const matchingText = matchingData.candidates[0]?.content?.parts?.[0]?.text || '{}';
                
                const jsonMatch = matchingText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  matchScore = Math.min(100, Math.max(0, parsed.matchScore || 0));
                  console.log(`Issue #${issue.number} match score: ${matchScore}%`);
                }
              }
            } catch (e) {
              console.error('Failed to parse AI matching response:', e);
              matchScore = 0;
            }
          }

          // Auto-comment "Please assign to me" if match score > 30% and issue has no assignees
          if (matchScore > 30 && !hasAssignees && !isAssignedToMe) {
            try {
              // First check if user has already commented on this issue
              const existingCommentsResponse = await fetch(
                `https://api.github.com/repos/${decodedFullName}/issues/${issue.number}/comments`,
                {
                  headers: {
                    Authorization: `token ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json',
                  },
                }
              );

              let hasAlreadyCommented = false;
              if (existingCommentsResponse.ok) {
                const existingComments = await existingCommentsResponse.json();
                hasAlreadyCommented = existingComments.some(comment => 
                  comment.user.login === user.githubUsername
                );
              }

              // Only comment if user hasn't already commented
              if (!hasAlreadyCommented) {
                // Generate a solution/approach for the issue
                const solutionPrompt = `Based on the developer's skills and the issue details, provide a brief technical approach/solution for how this issue could be tackled.

Issue: ${issue.title}
Description: ${issue.body || 'No description'}
Developer Skills: ${userSkills.map(s => s.skill || s.name).join(', ')}
Tech Stack: ${JSON.stringify(userTechStack)}

Provide a concise 2-3 sentence approach/solution.`;

                let solutionText = "I will analyze the requirements and implement a solution using my technical expertise.";
                
                try {
                  const solutionResponse = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        contents: [{ parts: [{ text: solutionPrompt }] }],
                      }),
                    }
                  );

                  if (solutionResponse.ok) {
                    const solutionData = await solutionResponse.json();
                    if (solutionData.candidates && solutionData.candidates.length > 0) {
                      const solutionRaw = solutionData.candidates[0]?.content?.parts?.[0]?.text || '';
                      // Clean up the response to get just the solution text
                      solutionText = solutionRaw.replace(/^["']|["']$/g, '').trim();
                    }
                  }
                } catch (solutionError) {
                  console.error('Error generating solution:', solutionError);
                }

                const commentResponse = await fetch(
                  `https://api.github.com/repos/${decodedFullName}/issues/${issue.number}/comments`,
                  {
                    method: 'POST',
                    headers: {
                      Authorization: `token ${GITHUB_TOKEN}`,
                      Accept: 'application/vnd.github.v3+json',
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      body: `@${user.githubUsername} Please assign this issue to me. I have a ${matchScore}% skill match for this task.\n\n**My Approach:** ${solutionText}`
                    }),
                  }
                );

                if (commentResponse.ok) {
                  console.log(`Auto-commented on issue #${issue.number} with ${matchScore}% match`);
                  autoCommented = true;
                } else {
                  console.error(`Failed to auto-comment on issue #${issue.number}:`, await commentResponse.text());
                }
              } else {
                console.log(`User has already commented on issue #${issue.number}, skipping auto-comment`);
              }
            } catch (commentError) {
              console.error(`Error auto-commenting on issue #${issue.number}:`, commentError);
            }
          }
        } catch (error) {
          console.error('Error calculating match score:', error);
          matchScore = 0;
        }
      }

      return {
        id: issue.id,
        issueNumber: issue.number,
        title: issue.title,
        body: issue.body,
        url: issue.html_url,
        repository: decodedFullName,
        state: issue.state,
        labels: issue.labels.map((label) => ({
          name: label.name,
          color: label.color,
        })),
        assignees:
          issue.assignees?.map((assignee) => ({
            username: assignee.login,
            avatar: assignee.avatar_url,
            url: assignee.html_url,
          })) || [],
        isAssignedToMe,
        requiredSkills: [], // Not extracted in this simplified version
        expertise: 'intermediate', // Default value
        estimatedHours: 8, // Default value
        matchScore,
        autoCommented,
        commentedAt: null, // Will be set when comments are analyzed
        createdAt: issue.created_at,
      };
    }));

    return NextResponse.json({
      issues: processedIssues,
    });
  } catch (error) {
    console.error("Get issues error:", error);
    return NextResponse.json(
      { error: "Failed to get issues", details: error.message },
      { status: 500 }
    );
  }
}
