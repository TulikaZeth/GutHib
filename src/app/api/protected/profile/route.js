import { NextResponse } from 'next/server';

/**
 * GET /api/protected/profile
 * Example protected API route that uses JWT verification
 */
export async function GET(request) {
  try {
    // User info is added to headers by middleware after JWT verification
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return protected data
    return NextResponse.json({
      success: true,
      message: 'This is protected data',
      user: {
        id: userId,
        email: userEmail,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Protected route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
