import jwt from 'jsonwebtoken';

// JWT utilities for custom token handling if needed
export const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH0_SECRET;

/**
 * Generate a JWT token
 * @param {Object} payload - Data to encode in the token
 * @param {string} expiresIn - Token expiration time (e.g., '7d', '24h')
 * @returns {string} JWT token
 */
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Decode a JWT token without verification (use with caution)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
export function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} JWT token or null
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Create a custom JWT token for a user session
 * @param {Object} user - User object from Auth0
 * @returns {string} Custom JWT token
 */
export function createUserToken(user) {
  const payload = {
    sub: user.sub,
    email: user.email,
    name: user.name,
    picture: user.picture,
  };
  return generateToken(payload);
}
