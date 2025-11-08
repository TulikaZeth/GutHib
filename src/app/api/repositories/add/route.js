import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db';
import Repository from '@/models/Repository';
import User from '@/models/User';

const secret = new TextEncoder().encode(process.env.AUTH0_SECRET || 'your-secret-key-min-32-chars-long!');

/**
 * POST /api/repositories/add
 * Add a GitHub repository to track
 */
export async function POST(request) {
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

    const { repoUrl } = await request.json();

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    // Extract owner and repo name from URL
    // Supports: https://github.com/owner/repo or github.com/owner/repo
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    const [, repoOwner, repoName] = match;
    const fullName = `${repoOwner}/${repoName}`;

    await connectDB();

    // Find user
    const user = await User.findOne({ email: payload.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if repository already exists for this user
    const existingRepo = await Repository.findOne({
      userId: user._id,
      fullName,
    });

    if (existingRepo) {
      return NextResponse.json(
        { error: 'Repository already added' },
        { status: 400 }
      );
    }

    // Verify repository exists on GitHub
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const ghResponse = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!ghResponse.ok) {
      return NextResponse.json(
        { error: 'Repository not found on GitHub' },
        { status: 404 }
      );
    }

    // Create repository
    const repository = await Repository.create({
      userId: user._id,
      repoOwner,
      repoName,
      repoUrl,
      fullName,
      lastPolled: new Date(),
    });

    // Trigger initial issue fetch
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/repositorydetails/${encodeURIComponent(fullName)}/poll`, {
      method: 'POST',
    }).catch(err => console.error('Initial poll failed:', err));

    return NextResponse.json({
      success: true,
      message: `Repository ${fullName} added successfully`,
      repository: {
        id: repository._id,
        fullName,
        url: repoUrl,
        addedAt: repository.createdAt,
      },
    });
  } catch (error) {
    console.error('Add repository error:', error);
    return NextResponse.json(
      { error: 'Failed to add repository', details: error.message },
      { status: 500 }
    );
  }
}
