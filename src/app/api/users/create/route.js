import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import connectDB from '@/lib/db';
import User from '@/models/User';

/**
 * POST /api/users/create
 * Create a new user in MongoDB when they sign up
 */
export async function POST(request) {
  try {
    const session = await auth0.getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ auth0Id: session.user.sub });
    
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: existingUser,
      });
    }

    // Create new user with minimal required fields
    const newUser = await User.create({
      auth0Id: session.user.sub,
      name: session.user.name,
      email: session.user.email,
      githubUsername: session.user.nickname || session.user.email.split('@')[0],
      githubUrl: session.user.nickname ? `https://github.com/${session.user.nickname}` : null,
      plan: 'FREE',
      onboardingCompleted: false,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser,
    }, { status: 201 });

  } catch (error) {
    console.error('User creation error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/create
 * Get or create current authenticated user
 */
export async function GET() {
  try {
    const session = await auth0.getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    // Try to find existing user
    let user = await User.findOne({ auth0Id: session.user.sub });
    
    // If user doesn't exist, create them
    if (!user) {
      user = await User.create({
        auth0Id: session.user.sub,
        name: session.user.name,
        email: session.user.email,
        githubUsername: session.user.nickname || session.user.email.split('@')[0],
        githubUrl: session.user.nickname ? `https://github.com/${session.user.nickname}` : null,
        plan: 'FREE',
        onboardingCompleted: false,
        isActive: true,
      });
    }

    return NextResponse.json({
      success: true,
      user,
    });

  } catch (error) {
    console.error('Get/create user error:', error);
    return NextResponse.json(
      { error: 'Failed to get or create user', details: error.message },
      { status: 500 }
    );
  }
}
