import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes accessible without any authentication
const PUBLIC_PATHS = ['/', '/login', '/register'];

// Routes accessible only to admins
const ADMIN_PATHS = ['/admin'];

// Roles that can access the full dashboard
const DASHBOARD_ROLES = ['ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT', 'FINANCIAL', 'MANAGER'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, Next.js internals, API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Read persisted auth from Zustand (stored as JSON in localStorage via cookie-less storage)
  // We use a custom cookie set by the client on login
  const authCookie = request.cookies.get('mastchieve-role')?.value;
  const role = authCookie ?? null;
  const isAuthenticated = !!role;

  // Public paths — always accessible
  if (PUBLIC_PATHS.includes(pathname)) {
    // If authenticated non-visitor tries to access /login or /register → redirect to dashboard
    if (isAuthenticated && role !== 'VISITOR' && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // VISITOR role → only landing page
  if (role === 'VISITOR' && pathname !== '/') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Admin-only paths
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
