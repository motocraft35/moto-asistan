import { cookies } from 'next/headers';
import { jwtVerify, SignJWT, JWK } from 'jose';

import db from './db';

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
  try {
    const cookieStore = await cookies();

    // 1. Try JWT session token
    const sessionToken = cookieStore.get('session_token')?.value;
    if (sessionToken) {
      try {
        const { payload } = await jwtVerify(sessionToken, secret);
        return payload.userId;
      } catch (error) {
        // Token invalid, move to next check
      }
    }

    // 2. Fallback to custom auth_session cookie
    const authSessionCookie = cookieStore.get('auth_session');
    if (authSessionCookie) {
      const decodedValue = decodeURIComponent(authSessionCookie.value);
      const sessionData = JSON.parse(decodedValue);

      if (sessionData.phone && sessionData.token) {
        const normalizedPhone = sessionData.phone.replace(/^0/, '');
        const withZero = '0' + normalizedPhone;

        const result = await db.execute({
          sql: 'SELECT id FROM users WHERE (phoneNumber = ? OR phoneNumber = ?) AND sessionToken = ?',
          args: [normalizedPhone, withZero, sessionData.token]
        });

        if (result.rows[0]) {
          return Number(result.rows[0].id);
        }
      }
    }
  } catch (e) {
    console.error('getUserId error:', e);
  }

  return null;
}
