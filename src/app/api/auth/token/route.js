import { NextResponse } from 'next/server';
import { createUserToken } from '@/lib/jwt';
import { auth0 } from '@/lib/auth0';

/**
 * GET /api/auth/token
 * Generate a custom JWT token for the authenticated user
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

    // Create a custom JWT token
    const token = createUserToken(session.user);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: session.user.sub,
        email: session.user.email,
        name: session.user.name,
      },
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
