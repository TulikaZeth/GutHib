import { NextResponse } from 'next/server';

/**
 * GET /api/github/user/comments?username={username}
 * Get latest 5 comments by a GitHub user across various repositories
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

    // Fetch user's recent events to find comment activities
    const eventsResponse = await fetch(
      `https://api.github.com/users/${username}/events?per_page=100`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!eventsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user events from GitHub' },
        { status: eventsResponse.status }
      );
    }

    const events = await eventsResponse.json();

    // Filter for IssueCommentEvent and extract comment details
    // Only include comments that contain assignment request phrases (case-insensitive)
    const assignmentPhrases = [
      'assign me',
      'assign to me',
      'i want to',
      'i need to be assigned',
      'please assign me',
      'assign it to me',
      'assign this to me',
      'assign me this',
      'please assign me',
      'can you assign me',
      'could you assign me',
      'i would like to be assigned',
      'i want to be assigned',
      'assign this issue to me',
      'can i be assigned',
      'may i be assigned',
    ];

    const commentEvents = events
      .filter(event => event.type === 'IssueCommentEvent')
      .filter(event => {
        const commentBody = event.payload.comment.body.toLowerCase();
        return assignmentPhrases.some(phrase => commentBody.includes(phrase));
      })
      .slice(0, 5)
      .map(event => ({
        id: event.payload.comment.id,
        body: event.payload.comment.body,
        createdAt: event.payload.comment.created_at,
        updatedAt: event.payload.comment.updated_at,
        commentUrl: event.payload.comment.html_url,
        issue: {
          number: event.payload.issue.number,
          title: event.payload.issue.title,
          url: event.payload.issue.html_url,
          state: event.payload.issue.state,
        },
        repository: {
          name: event.repo.name,
          url: `https://github.com/${event.repo.name}`,
        },
        user: {
          username: event.actor.login,
          avatar: event.actor.avatar_url,
          url: `https://github.com/${event.actor.login}`,
        },
      }));

    return NextResponse.json({
      username,
      totalComments: commentEvents.length,
      comments: commentEvents,
    });
  } catch (error) {
    console.error('Get user comments error:', error);
    return NextResponse.json(
      { error: 'Failed to get user comments', details: error.message },
      { status: 500 }
    );
  }
}
