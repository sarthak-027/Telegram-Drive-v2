// lib/auth.js
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Create a JWT token for a Telegram user
 */
export async function createToken(user) {
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.user;
  } catch {
    return null;
  }
}

/**
 * Get the current user from the request cookies
 */
export async function getUserFromRequest(req) {
  const token = req.cookies?.['td_token'];
  if (!token) return null;
  return await verifyToken(token);
}
