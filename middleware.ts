import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // List of paths that don't require authentication
  const publicPaths = [
    '/login',
    '/create-admin',
    '/api/auth/login',
    '/api/auth/create-admin',
    '/_next',
    '/favicon.ico',
    '/api/verify'
  ];

  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    console.log('Public path accessed:', pathname);
    return NextResponse.next();
  }

  // Check for token in cookies
  const token = request.cookies.get('token')?.value;

  if (!token) {
    console.log('No token found, redirecting to login');
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 