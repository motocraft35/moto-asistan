import { cookies } from 'next/headers';
import { jwtVerify, SignJWT, JWK } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-key-12345');

export async function createSession(userId) {
  const now = new Date();
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime('30d') // Extended session for better UX
    .sign(secret);

  (await cookies()).set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    path: '/',
  });
}

export async function destroySession() {
  (await cookies()).delete('session_token');
}

export async function getUserId() {
  const sessionToken = (await cookies()).get('session_token')?.value;
  if (!sessionToken) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(sessionToken, secret);
    return payload.userId;
  } catch (error) {
    console.error('Invalid session token:', error);
    destroySession(); // Destroy invalid token
    return null;
  }
}
