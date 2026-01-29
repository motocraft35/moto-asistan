import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Strict check for all dashboard routes
    if (pathname.startsWith('/dashboard')) {
        const sessionToken = request.cookies.get('session_token')?.value;
        const authSession = request.cookies.get('auth_session')?.value;

        // If no valid session identifiers found, redirect to login
        if (!sessionToken && !authSession) {
            console.log(`[Security] Blocking unauthorized access to ${pathname}`);
            const loginUrl = new URL('/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};
