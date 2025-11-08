import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db';
import User from '@/models/User';

const secret = new TextEncoder().encode(process.env.AUTH0_SECRET || 'your-secret-key-min-32-chars-long!');

/**
 * POST /api/onboarding
 * Save user onboarding data with combined analysis to MongoDB
 */
export async function POST(request) {
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

    const body = await request.json();
    const { githubUsername, combinedAnalysis } = body;

    // Connect to database
    await connectDB();

    // Prepare user data for MongoDB using combined analysis
    const userData = {
      githubUsername,
      githubUrl: githubUsername ? `https://github.com/${githubUsername}` : null,
      
      // Use combined tech stack from analysis
      techStack: combinedAnalysis.techStack || {
        languages: [],
        frameworks: [],
        tools: [],
        libraries: [],
        databases: [],
        cloudPlatforms: [],
      },
      
      // Use combined skills with averaged scores
      skills: combinedAnalysis.skills || [],
      
      // Use preferred issues from user input
      preferredIssues: combinedAnalysis.preferredIssues || [],
      
      // Experience data from resume or github
      totalExperience: combinedAnalysis.experience?.total_years || 1,
      confidenceLevel: combinedAnalysis.experience?.confidence || 
        (combinedAnalysis.experienceLevel === 'beginner' ? 'low' : 
         combinedAnalysis.experienceLevel === 'intermediate' ? 'medium' : 'high'),
      
      onboardingCompleted: true,
      isActive: true,
    };

    // Find user by email from session and update
    const updatedUser = await User.findOneAndUpdate(
      { email: payload.email },
      { $set: userData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        githubUsername: updatedUser.githubUsername,
        skills: updatedUser.skills,
        techStack: updatedUser.techStack,
      },
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to save onboarding data', details: error.message },
      { status: 500 }
    );
  }
}
