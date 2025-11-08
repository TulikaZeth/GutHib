import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db';
import User from '@/models/User';

const secret = new TextEncoder().encode(process.env.AUTH0_SECRET || 'your-secret-key-min-32-chars-long!');

/**
 * GET /api/issues/assigned
 * Get all issues assigned to the user from GitHub
 */
export async function GET() {
  try {
    // Get session
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, secret);
    
    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email: payload.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get GitHub username
    const githubUsername = user.githubUsername;
    if (!githubUsername) {
      return NextResponse.json(
        { error: 'GitHub username not found for user' },
        { status: 404 }
      );
    }

    // Fetch assigned issues from GitHub API
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    // Search for issues assigned to the user
    const searchQuery = `assignee:${githubUsername} is:issue`;
    const issuesResponse = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&sort=updated&order=desc&per_page=10`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!issuesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch assigned issues from GitHub' },
        { status: issuesResponse.status }
      );
    }

    const searchResults = await issuesResponse.json();

    // Format the issues data to match the expected response format
    const assignedIssues = searchResults.items.map(issue => ({
      id: issue.id,
      issueNumber: issue.number,
      title: issue.title,
      body: issue.body,
      url: issue.html_url,
      repository: issue.repository_url.split('/').slice(-2).join('/'),
      state: issue.state,
      labels: issue.labels.map(label => ({
        name: label.name,
        color: label.color,
      })),
      assignedAt: issue.updated_at,
      createdAt: issue.created_at,
      closedAt: issue.closed_at,
      assignees: issue.assignees.map(assignee => ({
        username: assignee.login,
        avatar: assignee.avatar_url,
        url: assignee.html_url,
      })),
      author: {
        username: issue.user.login,
        avatar: issue.user.avatar_url,
        url: issue.user.html_url,
      },
    }));

    return NextResponse.json({
      success: true,
      issues: assignedIssues,
      totalCount: searchResults.total_count,
    });
  } catch (error) {
    console.error('Fetch issues error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues', details: error.message },
      { status: 500 }
    );
  }
}

