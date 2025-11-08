 import { auth0 } from '@/lib/auth0';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

// Handle GET requests for authentication
export async function GET(request, { params }) {
  const { auth0: authParams } = params;
  const path = authParams.join('/');

  try {
    // Handle different auth routes
    switch (path) {
      case 'login':
        return auth0.handleLogin(request);
      
      case 'logout':
        return auth0.handleLogout(request);
      
      case 'callback':
        return auth0.handleCallback(request);
      
      case 'profile':
        return auth0.handleProfile(request);
      
      default:
        return NextResponse.json(
          { error: 'Not found' },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('Auth route error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication error' },
      { status: error.status || 500 }
    );
  }
}

