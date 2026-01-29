import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Define protected routes
    if (pathname.startsWith('/dashboard')) {
        const sessionToken = request.cookies.get('session_token')?.value;
        const authSession = request.cookies.get('auth_session')?.value;

        // If no session found, redirect to login
        if (!sessionToken && !authSession) {
            const loginUrl = new URL('/login', request.url);
            // Optional: Store the intended destination to redirect back after login
            // loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// Match all routes except static files, api routes, etc.
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files like manifest, icons)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public|icons|manifest.json).*)',
    ],
};
