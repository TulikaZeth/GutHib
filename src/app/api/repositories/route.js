import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db';
import Repository from '@/models/Repository';
import User from '@/models/User';

const secret = new TextEncoder().encode(process.env.AUTH0_SECRET || 'your-secret-key-min-32-chars-long!');

/**
 * GET /api/repositories
 * Get all tracked repositories for the current user
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

    // Get all repositories for this user
    const repositories = await Repository.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      repositories: repositories.map(repo => ({
        id: repo._id,
        fullName: repo.fullName,
        owner: repo.repoOwner,
        name: repo.repoName,
        url: repo.repoUrl,
        trackedIssues: repo.totalIssues || 0,
        lastPolled: repo.lastPolled,
        isActive: repo.isActive,
        addedAt: repo.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get repositories error:', error);
    return NextResponse.json(
      { error: 'Failed to get repositories', details: error.message },
      { status: 500 }
    );
  }
}
