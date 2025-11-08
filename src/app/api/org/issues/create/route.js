import { NextResponse } from 'next/server';
import { getOrgSession } from '@/lib/orgAuth';
import connectDB from '@/lib/db';
import OrgAccount from '@/models/OrgAccount';

export async function POST(request) {
  try {
    const session = await getOrgSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { repoName, title, body, labels } = await request.json();

    if (!repoName || !title || !body) {
      return NextResponse.json(
        { error: 'Repository name, title, and body are required' },
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

    // Create issue on GitHub
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const issuePayload = {
      title,
      body,
    };

    // Add labels if provided
    if (labels && Array.isArray(labels) && labels.length > 0) {
      issuePayload.labels = labels;
    }

    const createResponse = await fetch(
      `https://api.github.com/repos/${repoName}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issuePayload),
      }
    );

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      return NextResponse.json(
        { error: `Failed to create issue on GitHub: ${errorData.message || 'Unknown error'}` },
        { status: createResponse.status }
      );
    }

    const createdIssue = await createResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Issue created successfully on GitHub',
      issueNumber: createdIssue.number,
      issueUrl: createdIssue.html_url,
      issue: {
        number: createdIssue.number,
        title: createdIssue.title,
        body: createdIssue.body,
        html_url: createdIssue.html_url,
        state: createdIssue.state,
        labels: createdIssue.labels.map(l => l.name),
        created_at: createdIssue.created_at,
      },
    });
  } catch (error) {
    console.error('Create issue error:', error);
    return NextResponse.json(
      { error: 'Failed to create issue', details: error.message },
      { status: 500 }
    );
  }
}
