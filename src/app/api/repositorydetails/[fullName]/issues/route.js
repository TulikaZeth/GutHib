import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { 
  calculateAdvancedMatchScore, 
  generatePersonalizedApproach,
  inferDeveloperRoles 
} from "@/lib/advancedMatching";

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

    // Get user's skills and complete profile for advanced matching
    const userSkills = user.skills || [];
    const userProfile = {
      skills: userSkills,
      techStack: user.techStack || { languages: [], frameworks: [], tools: [], databases: [], cloudPlatforms: [], libraries: [] },
      totalExperience: user.totalExperience || 0,
      confidenceLevel: user.confidenceLevel || 'medium',
      summary: user.summary || '',
      expertise: user.expertise || 'intermediate',
    };

    // Infer developer roles for logging
    const developerRoles = inferDeveloperRoles(userProfile);
    console.log(`Developer roles inferred: ${developerRoles.join(', ') || 'None'}`);

    // Process issues with advanced match scores
    const processedIssues = await Promise.all(githubIssues.map(async (issue) => {
      let matchScore = 0;
      let matchAnalysis = null;
      let autoCommented = false;

      // Only calculate match score if user has skills
      const isAssignedToMe = issue.assignees?.some(
        (assignee) => assignee.login === user.githubUsername
      ) || false;
      const hasAssignees = issue.assignees && issue.assignees.length > 0;

      if (userSkills.length > 0 || Object.keys(userProfile.techStack).length > 0) {
        try {
          const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
          
          // Use advanced matching system
          const matchResult = await calculateAdvancedMatchScore(
            {
              title: issue.title,
              body: issue.body || '',
              labels: issue.labels,
              repository: decodedFullName,
            },
            userProfile,
            GEMINI_API_KEY
          );
          
          matchScore = matchResult.matchScore;
          matchAnalysis = matchResult.analysis;
          
          console.log(`Issue #${issue.number} "${issue.title}" - Match: ${matchScore}% (Recommendation: ${matchAnalysis?.recommendedAction || 'N/A'})`);
          if (matchAnalysis?.primaryReason) {
            console.log(`  → Reason: ${matchAnalysis.primaryReason}`);
          }

          // Auto-comment if match score is good and recommended action is positive
          const shouldComment = matchScore > 40 && 
                               !hasAssignees && 
                               !isAssignedToMe &&
                               matchAnalysis?.recommendedAction !== 'skip';

          if (shouldComment) {
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
              let hasSystemComment = false;
              
              if (existingCommentsResponse.ok) {
                const existingComments = await existingCommentsResponse.json();
                
                // Check if user has any comment
                hasAlreadyCommented = existingComments.some(comment => 
                  comment.user.login === user.githubUsername
                );
                
                // Check if there's already a system-generated comment
                hasSystemComment = existingComments.some(comment => 
                  comment.user.login === user.githubUsername && 
                  comment.body.includes('Please assign this issue to me') &&
                  comment.body.includes('skill match')
                );
              }

              // Only comment if no previous comment exists
              if (!hasAlreadyCommented || !hasSystemComment) {
                // Generate personalized approach
                const approachText = await generatePersonalizedApproach(
                  {
                    title: issue.title,
                    body: issue.body || '',
                    labels: issue.labels,
                  },
                  userProfile,
                  matchAnalysis,
                  GEMINI_API_KEY
                );

                // Build comment with match details
                let commentBody = `Please assign this issue to me. I have a **${matchScore}% skill match** for this task.\n\n`;
                
                // Add role information if available
                if (matchAnalysis?.inferredRoles && matchAnalysis.inferredRoles.length > 0) {
                  commentBody += `**My Role**: ${matchAnalysis.inferredRoles.join(' / ').toUpperCase()} Developer\n\n`;
                }
                
                // Add strengths if available
                if (matchAnalysis?.strengths && matchAnalysis.strengths.length > 0) {
                  commentBody += `**Key Strengths**:\n${matchAnalysis.strengths.map(s => `- ${s}`).join('\n')}\n\n`;
                }
                
                commentBody += `**My Approach**:\n${approachText}`;

                const commentResponse = await fetch(
                  `https://api.github.com/repos/${decodedFullName}/issues/${issue.number}/comments`,
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
                  console.log(`✅ Auto-commented on issue #${issue.number} with ${matchScore}% match`);
                  autoCommented = true;
                } else {
                  console.error(`Failed to auto-comment on issue #${issue.number}:`, await commentResponse.text());
                }
              } else {
                console.log(`⏭️ Already commented on issue #${issue.number}, skipping`);
              }
            } catch (commentError) {
              console.error(`Error auto-commenting on issue #${issue.number}:`, commentError);
            }
          } else {
            if (matchScore <= 40) {
              console.log(`⏭️ Match score too low (${matchScore}%) for issue #${issue.number}`);
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
        matchScore,
        matchAnalysis: matchAnalysis ? {
          primaryReason: matchAnalysis.primaryReason,
          strengths: matchAnalysis.strengths,
          concerns: matchAnalysis.concerns,
          recommendedAction: matchAnalysis.recommendedAction,
          inferredRoles: matchAnalysis.inferredRoles,
        } : null,
        autoCommented,
        createdAt: issue.created_at,
      };
    }));

    // Sort issues by match score (highest first) for better UX
    const sortedIssues = processedIssues.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      issues: sortedIssues,
      developerProfile: {
        roles: developerRoles,
        skills: userSkills.length,
        experience: userProfile.totalExperience,
        confidence: userProfile.confidenceLevel,
      }
    });
  } catch (error) {
    console.error("Get issues error:", error);
    return NextResponse.json(
      { error: "Failed to get issues", details: error.message },
      { status: 500 }
    );
  }
}
