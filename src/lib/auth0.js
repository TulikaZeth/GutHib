// Simple authentication utility (Auth0 structure maintained for consistency)
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.AUTH0_SECRET || 'your-secret-key-min-32-chars-long!');

export const auth0 = {
  async getSession() {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('session')?.value;
      
      if (!token) return null;
      
      const { payload } = await jwtVerify(token, secret);
      return { user: payload };
    } catch (error) {
      return null;
    }
  },

  async handleLogin(request) {
    // Redirect to signin page
    return Response.redirect(new URL('/auth/signin', request.url));
  },

  async handleLogout(request) {
    const response = Response.redirect(new URL('/', request.url));
    response.headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0');
    return response;
  },

  async handleCallback(request) {
    // This would normally handle Auth0 callback
    return Response.redirect(new URL('/', request.url));
  },

  async handleProfile(request) {
    const session = await this.getSession();
    return Response.json(session?.user || {});
  },
};

export async function createSession(user) {
  const token = await new SignJWT({ 
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
    picture: user.picture || null,
    nickname: user.githubUsername,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getSession() {
  return auth0.getSession();
}
