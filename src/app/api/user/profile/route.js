import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db';
import User from '@/models/User';

const secret = new TextEncoder().encode(process.env.AUTH0_SECRET || 'your-secret-key-min-32-chars-long!');

/**
 * GET /api/user/profile
 * Get complete user profile from MongoDB
 */
export async function GET() {
  try {
    // Get session from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: payload.email }).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        githubUsername: user.githubUsername,
        githubUrl: user.githubUrl,
        plan: user.plan,
        isActive: user.isActive,
        skills: user.skills,
        techStack: user.techStack,
        preferredIssues: user.preferredIssues,
        totalExperience: user.totalExperience,
        confidenceLevel: user.confidenceLevel,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    );
  }
}
