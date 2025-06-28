import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    const supabase = createMiddlewareClient({ req, res });
    
    // Check if the user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Get the pathname from the request
    const { pathname } = req.nextUrl;
    
    console.log('=== MIDDLEWARE DEBUG ===');
    console.log('Pathname:', pathname);
    console.log('Session exists:', !!session);
    console.log('Session user:', session?.user?.email);
    console.log('Session error:', sessionError);
    console.log('Session access token:', session?.access_token ? 'PRESENT' : 'MISSING');
    console.log('Session expires at:', session?.expires_at);
    console.log('Current time:', new Date().toISOString());
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Define protected routes that require authentication
    const protectedRoutes = [
      '/dashboard',
      '/return',
      '/dashboard/role-selection',
    ];
    
    // Define auth routes
    const authRoutes = [
      '/auth/login',
      '/auth/signup',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];
    
    // Check if the current route is protected
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );
    
    // Check if the current route is an auth route
    const isAuthRoute = authRoutes.some(route => pathname === route);
    
    console.log('Is protected route:', isProtectedRoute);
    console.log('Is auth route:', isAuthRoute);
    
    // If the route is protected and the user is not authenticated, redirect to login
    if (isProtectedRoute && !session) {
      console.log('Redirecting to login - no session for protected route');
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // If the user is authenticated and trying to access an auth route, redirect to role selection
    if (isAuthRoute && session) {
      console.log('Redirecting to role selection - authenticated user on auth route');
      return NextResponse.redirect(new URL('/dashboard/role-selection', req.url));
    }
    
    console.log('=== MIDDLEWARE DEBUG END ===');
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // Return the response without modification on error
    return res;
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/return/:path*',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
  ],
};