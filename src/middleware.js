import { NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';

/**
 * Middleware to verify JWT tokens for protected routes
 * This demonstrates custom JWT verification alongside Auth0
 */
export async function middleware(request) {
  const path = request.nextUrl.pathname;

  // Define protected API routes that require JWT verification
  const protectedApiRoutes = ['/api/protected'];
  
  if (protectedApiRoutes.some(route => path.startsWith(route))) {
    try {
      const authHeader = request.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);
      
      if (!token) {
        return NextResponse.json(
          { error: 'No token provided' },
          { status: 401 }
        );
      }

      // Verify the token
      const decoded = verifyToken(token);
      
      // Add user info to headers for use in API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.sub);
      requestHeaders.set('x-user-email', decoded.email);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/api/protected/:path*',
  ],
};
