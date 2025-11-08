import { NextResponse } from 'next/server';
import { getOrgSession } from '@/lib/orgAuth';
import connectDB from '@/lib/db';
import OrgAccount from '@/models/OrgAccount';
import OrgIssueAssignment from '@/models/OrgIssueAssignment';

export async function GET(request, { params }) {
  try {
    const session = await getOrgSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { repoName } = await params;
    const decodedRepoName = decodeURIComponent(repoName);

    await connectDB();

    // Verify organization owns this repo
    const orgAccount = await OrgAccount.findById(session.orgId);
    if (!orgAccount) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const repo = orgAccount.repositories.find(r => r.repoName === decodedRepoName);
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found in your organization' },
        { status: 404 }
      );
    }

    // Fetch issues from GitHub
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const ghResponse = await fetch(
      `https://api.github.com/repos/${decodedRepoName}/issues?state=open&per_page=100`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!ghResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch issues from GitHub' },
        { status: ghResponse.status }
      );
    }

    const githubIssues = await ghResponse.json();

    // Filter out pull requests (GitHub API returns PRs as issues)
    const issues = githubIssues.filter(issue => !issue.pull_request);

    // Get assignment status from our database
    const assignments = await OrgIssueAssignment.find({
      orgAccountId: session.orgId,
      repoFullName: decodedRepoName,
    });

    // Map issues with assignment status
    const issuesWithAssignments = issues.map(issue => {
      const assignment = assignments.find(a => a.issueNumber === issue.number);
      
      return {
        number: issue.number,
        title: issue.title,
        body: issue.body,
        html_url: issue.html_url,
        state: issue.state,
        labels: issue.labels.map(l => l.name),
        created_at: issue.created_at,
        assignedTo: assignment ? assignment.assignedUserGithub : null,
        assignmentStatus: assignment ? assignment.status : null,
      };
    });

    return NextResponse.json({
      success: true,
      issues: issuesWithAssignments,
      total: issuesWithAssignments.length,
    });
  } catch (error) {
    console.error('Get issues error:', error);
    return NextResponse.json(
      { error: 'Failed to get issues', details: error.message },
      { status: 500 }
    );
  }
}
