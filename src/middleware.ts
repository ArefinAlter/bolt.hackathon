import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    const supabase = createMiddlewareClient({ req, res });
    
    // Get the pathname from the request
    const { pathname } = req.nextUrl;
    
    console.log('=== MIDDLEWARE DEBUG ===');
    console.log('Pathname:', pathname);
    
    // Define auth routes that should redirect authenticated users
    const authRoutes = [
      '/auth/login',
      '/auth/signup',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];
    
    // Check if the current route is an auth route
    const isAuthRoute = authRoutes.some(route => pathname === route);
    
    if (isAuthRoute) {
      // For auth routes, let the AuthGuard handle the logic
      // Just pass through and let client-side handle redirects
      console.log('Auth route detected, letting AuthGuard handle');
      return res;
    }
    
    console.log('=== MIDDLEWARE DEBUG END ===');
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // Return the response without modification on error
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};