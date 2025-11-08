import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db';
import Organization from '@/models/Organization';
import Issue from '@/models/Issue';
import User from '@/models/User';

const secret = new TextEncoder().encode(process.env.AUTH0_SECRET || 'your-secret-key-min-32-chars-long!');

/**
 * GET /api/organizationsdetails/[orgName]/issues
 * Get all issues for an organization
 */
export async function GET(request, { params }) {
  try {
    const { orgName } = params;
    
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

    // Find organization
    const organization = await Organization.findOne({
      userId: user._id,
      orgName,
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get all issues for this organization
    const issues = await Issue.find({ organizationId: organization._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      issues: issues.map(issue => ({
        id: issue._id,
        issueNumber: issue.issueNumber,
        title: issue.title,
        body: issue.body,
        url: issue.url,
        repository: issue.repository,
        state: issue.state,
        labels: issue.labels,
        isAssignedToMe: issue.isAssignedToMe,
        requiredSkills: issue.requiredSkills,
        expertise: issue.expertise,
        estimatedHours: issue.estimatedHours,
        matchScore: issue.matchScore,
        commentedAt: issue.commentedAt,
        createdAt: issue.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get issues error:', error);
    return NextResponse.json(
      { error: 'Failed to get issues', details: error.message },
      { status: 500 }
    );
  }
}
