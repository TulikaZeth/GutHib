import { NextResponse } from 'next/server';

/**
 * GET /api/github/user/assigned-issues?username={username}
 * Get latest 5 issues assigned to a GitHub user across all repositories
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'GitHub username is required' },
        { status: 400 }
      );
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    // Search for issues assigned to the user
    // Using GitHub Search API for assigned issues
    const searchQuery = `assignee:${username} is:issue`;
    const issuesResponse = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&sort=updated&order=desc&per_page=5`,
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

    // Format the issues data
    const assignedIssues = searchResults.items.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      url: issue.html_url,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at,
      labels: issue.labels.map(label => ({
        name: label.name,
        color: label.color,
        description: label.description,
      })),
      assignees: issue.assignees.map(assignee => ({
        username: assignee.login,
        avatar: assignee.avatar_url,
        url: assignee.html_url,
      })),
      repository: {
        name: issue.repository_url.split('/').slice(-2).join('/'),
        url: issue.html_url.split('/issues/')[0],
      },
      comments: issue.comments,
      author: {
        username: issue.user.login,
        avatar: issue.user.avatar_url,
        url: issue.user.html_url,
      },
    }));

    return NextResponse.json({
      username,
      totalIssues: searchResults.total_count,
      issues: assignedIssues,
    });
  } catch (error) {
    console.error('Get assigned issues error:', error);
    return NextResponse.json(
      { error: 'Failed to get assigned issues', details: error.message },
      { status: 500 }
    );
  }
}
