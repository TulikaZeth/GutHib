import { NextResponse } from 'next/server';
import { getOrgSession } from '@/lib/orgAuth';
import connectDB from '@/lib/db';
import OrgAccount from '@/models/OrgAccount';
import OrgIssueAssignment from '@/models/OrgIssueAssignment';
import User from '@/models/User';

/**
 * POST /api/org/issues/assign-developer
 * Assign a selected developer to an issue
 */
export async function POST(request) {
  try {
    const session = await getOrgSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { repoName, issueNumber, developerId, developerUsername, matchScore, activityScore, workloadScore, finalScore } = await request.json();

    if (!repoName || !issueNumber || !developerUsername) {
      return NextResponse.json(
        { error: 'Repository name, issue number, and developer username are required' },
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

    // Get developer details if registered
    let developer = null;
    if (developerId && !developerId.startsWith('temp_')) {
      developer = await User.findById(developerId);
    }

    // Generate personalized roadmap with Gemini AI
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const roadmapPrompt = `Generate a detailed technical roadmap for a developer to solve this GitHub issue:

Issue Title: ${issue.title}
Issue Description: ${issue.body || 'No description'}
Labels: ${issue.labels.map(l => l.name).join(', ')}

Developer Username: ${developerUsername}
${developer ? `Developer Skills: ${developer.skills?.map(s => `${s.skill || s.name} (${s.score || s.level || 50}%)`).join(', ') || 'Not specified'}
Tech Stack: ${JSON.stringify(developer.techStack || {})}
Experience: ${developer.experience || 'Not specified'}` : 'Developer profile not available'}

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

    let aiRoadmap = `## Implementation Steps

1. **Understand the Issue**: Review the issue description and requirements carefully
2. **Setup Environment**: Clone the repository and set up your local development environment
3. **Implement Solution**: Write code following the project's coding standards
4. **Test Thoroughly**: Test your changes to ensure they work as expected
5. **Submit PR**: Create a pull request with a clear description of your changes

Good luck! 🚀`;

    if (roadmapResponse.ok) {
      try {
        const roadmapData = await roadmapResponse.json();
        if (roadmapData.candidates && roadmapData.candidates.length > 0) {
          const generatedRoadmap = roadmapData.candidates[0]?.content?.parts?.[0]?.text;
          if (generatedRoadmap) {
            aiRoadmap = generatedRoadmap;
          }
        }
      } catch (e) {
        console.error('Failed to parse roadmap response:', e);
      }
    }

    // Assign the developer to the GitHub issue
    console.log(`Attempting to assign ${developerUsername} to ${repoName}#${issueNumber}`);
    console.log('GitHub Token present:', !!GITHUB_TOKEN);
    
    // Try to assign directly - GitHub allows assignment to:
    // 1. Collaborators
    // 2. Users who have commented on the issue
    // 3. Issue author
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
          assignees: [developerUsername] 
        }),
      }
    );

    // If assignment fails, post as recommendation instead
    if (!assignResponse.ok) {
      const errorText = await assignResponse.text();
      console.warn(`⚠️ Could not assign ${developerUsername} to issue (${assignResponse.status})`);
      console.log('Posting as recommendation instead...');
      
      // Post roadmap as comment on GitHub
      const commentBody = `🤖 **AI-Powered Recommendation**

We recommend assigning this issue to @${developerUsername}!

**Match Analysis:**
- 🎯 Skill Match: ${matchScore || 0}%
- 📊 Activity Level: ${activityScore || 0}%
- ⚡ Availability: ${workloadScore || 0}%
- 🏆 Overall Score: ${finalScore || 0}%

💡 *To assign @${developerUsername}, they need to either be a collaborator, have commented on this issue, or be the issue author.*

---

## 🗺️ Personalized Roadmap for @${developerUsername}

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

      // Create assignment record with 'recommended' status
      const assignmentData = {
        orgAccountId: session.orgId,
        repoFullName: repoName,
        repoUrl: repo.repoUrl,
        issueNumber,
        issueTitle: issue.title,
        issueUrl: issue.html_url,
        issueBody: issue.body,
        labels: issue.labels.map(l => l.name),
        requiredSkills: [],
        expertise: 'intermediate',
        estimatedHours: 8,
        matchScore: matchScore || 0,
        activityScore: activityScore || 0,
        workloadScore: workloadScore || 0,
        finalScore: finalScore || 0,
        assignedUserGithub: developerUsername,
        aiRoadmap,
        githubCommentUrl: commentUrl,
        commentedAt: commentUrl ? new Date() : null,
        status: 'pending', // Use 'pending' instead of 'recommended' until model is updated
      };

      // Only add assignedUserId if it's a registered developer
      if (developer && developer._id) {
        assignmentData.assignedUserId = developer._id;
      }

      const assignment = await OrgIssueAssignment.create(assignmentData);

      return NextResponse.json({
        success: true,
        message: `Recommended @${developerUsername} (unable to assign, posted as recommendation)`,
        assignedTo: developerUsername,
        isRecommendation: true,
        matchScore: matchScore || 0,
        activityScore: activityScore || 0,
        workloadScore: workloadScore || 0,
        finalScore: finalScore || 0,
        commentUrl,
        warning: `${developerUsername} could not be assigned. They need to be a collaborator or have interacted with the issue.`,
        assignment: {
          id: assignment._id,
          status: assignment.status,
        },
      });
    }

    console.log(`✅ Successfully assigned ${developerUsername} to issue #${issueNumber}`);

    // Post roadmap as comment on GitHub
    const commentBody = `🤖 **AI-Powered Assignment**

This issue has been assigned to @${developerUsername} by our intelligent matching system!

**Match Analysis:**
- 🎯 Skill Match: ${matchScore || 0}%
- 📊 Activity Level: ${activityScore || 0}%
- ⚡ Availability: ${workloadScore || 0}%
- 🏆 Overall Score: ${finalScore || 0}%

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

    // Create assignment record
    const assignmentData = {
      orgAccountId: session.orgId,
      repoFullName: repoName,
      repoUrl: repo.repoUrl,
      issueNumber,
      issueTitle: issue.title,
      issueUrl: issue.html_url,
      issueBody: issue.body,
      labels: issue.labels.map(l => l.name),
      requiredSkills: [],
      expertise: 'intermediate',
      estimatedHours: 8,
      matchScore: matchScore || 0,
      activityScore: activityScore || 0,
      workloadScore: workloadScore || 0,
      finalScore: finalScore || 0,
      assignedUserGithub: developerUsername,
      aiRoadmap,
      githubCommentUrl: commentUrl,
      commentedAt: commentUrl ? new Date() : null,
      status: 'assigned',
    };

    // Only add assignedUserId if it's a registered developer
    if (developer && developer._id) {
      assignmentData.assignedUserId = developer._id;
    }

    const assignment = await OrgIssueAssignment.create(assignmentData);

    return NextResponse.json({
      success: true,
      message: 'Issue assigned successfully',
      assignedTo: developerUsername,
      matchScore: matchScore || 0,
      activityScore: activityScore || 0,
      workloadScore: workloadScore || 0,
      finalScore: finalScore || 0,
      commentUrl,
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
