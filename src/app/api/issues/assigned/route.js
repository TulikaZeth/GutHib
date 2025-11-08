import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db';
import Issue from '@/models/Issue';
import Repository from '@/models/Repository';
import User from '@/models/User';

const secret = new TextEncoder().encode(process.env.AUTH0_SECRET || 'your-secret-key-min-32-chars-long!');

/**
 * GET /api/issues/assigned
 * Get all issues assigned to the user
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

    // Get all issues assigned to this user
    const issues = await Issue.find({
      userId: user._id,
      isAssignedToMe: true,
    })
      .sort({ createdAt: -1 })
      .populate('repositoryId')
      .lean();

    return NextResponse.json({
      success: true,
      issues: issues.map(issue => ({
        id: issue._id,
        issueNumber: issue.issueNumber,
        title: issue.title,
        body: issue.body,
        url: issue.url,
        repository: issue.repositoryId?.fullName || 'Unknown',
        state: issue.state,
        labels: issue.labels,
        requiredSkills: issue.requiredSkills,
        expertise: issue.expertise,
        estimatedHours: issue.estimatedHours,
        matchScore: issue.matchScore,
        commentedAt: issue.commentedAt,
        assignedAt: issue.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Fetch issues error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues', details: error.message },
      { status: 500 }
    );
  }
}

