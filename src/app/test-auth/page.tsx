'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TestAuthPage() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    const info: any = {};

    try {
      // 1. Check Supabase client configuration
      info.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      info.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING';
      info.supabaseUrlValid = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      info.supabaseAnonKeyValid = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // 2. Check if Supabase client can be created
      try {
        const testClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        info.supabaseClientCreated = true;
      } catch (clientError) {
        info.supabaseClientError = clientError;
        info.supabaseClientCreated = false;
      }

      // 3. Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      info.session = session ? {
        user: session.user?.email,
        expires: session.expires_at,
        accessToken: session.access_token ? 'PRESENT' : 'MISSING'
      } : null;
      info.sessionError = sessionError;

      // 4. Check if user exists in profiles table
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        info.profile = profile;
        info.profileError = profileError;
      }

      // 5. Test Edge Function
      if (session?.access_token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-profile`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: session.user.id,
              business_name: 'Test Business'
            })
          });
          
          info.edgeFunctionStatus = response.status;
          info.edgeFunctionResponse = await response.text();
        } catch (edgeError) {
          info.edgeFunctionError = edgeError;
        }
      }

      // 6. Test navigation
      info.currentPath = window.location.pathname;
      info.userAgent = navigator.userAgent;

    } catch (error) {
      info.generalError = error;
    }

    setDebugInfo(info);
    setIsLoading(false);
  };

  const testSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });
      
      setDebugInfo((prev: any) => ({
        ...prev,
        signInResult: { data, error }
      }));
    } catch (error) {
      setDebugInfo((prev: any) => ({
        ...prev,
        signInError: error
      }));
    }
    setIsLoading(false);
  };

  const testSessionPersistence = async () => {
    setIsLoading(true);
    try {
      // Test sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (error) {
        setDebugInfo((prev: any) => ({
          ...prev,
          signInError: error
        }));
        return;
      }
      
      setDebugInfo((prev: any) => ({
        ...prev,
        signInResult: { data, error }
      }));
      
      // Wait and check session
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      setDebugInfo((prev: any) => ({
        ...prev,
        sessionAfterSignIn: {
          exists: !!session,
          user: session?.user?.email,
          error: sessionError,
          accessToken: session?.access_token ? 'PRESENT' : 'MISSING'
        }
      }));
      
      // Test navigation
      setTimeout(() => {
        window.location.href = '/dashboard/role-selection';
      }, 1000);
      
    } catch (error) {
      setDebugInfo((prev: any) => ({
        ...prev,
        sessionTestError: error
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const testNavigation = () => {
    router.push('/dashboard/role-selection');
  };

  const testFullAuthFlow = async () => {
    try {
      console.log('=== TESTING FULL AUTH FLOW ===');
      
      // Get current session from debug info
      const currentSession = debugInfo.session;
      
      const flowInfo = {
        existingSession: !!currentSession,
        sessionUser: currentSession?.user,
        testingNavigation: true,
      };
      
      console.log('Full auth flow info:', flowInfo);
      
      setDebugInfo((prev: any) => ({
        ...prev,
        fullAuthFlow: flowInfo
      }));
      
      // Test navigation
      await testMiddlewareWithSession();
    } catch (error) {
      console.error('Full auth flow test error:', error);
    }
  };

  const testNavigationWithExistingSession = async () => {
    setIsLoading(true);
    try {
      console.log('=== TESTING NAVIGATION WITH EXISTING SESSION ===');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No existing session found');
        setDebugInfo((prev: any) => ({
          ...prev,
          navigationTest: {
            sessionExists: false,
            error: 'No session found'
          }
        }));
        return;
      }
      
      console.log('Existing session found:', session.user?.email);
      
      // Test navigation
      console.log('Attempting navigation to role selection...');
      window.location.replace('/dashboard/role-selection');
      
      setDebugInfo((prev: any) => ({
        ...prev,
        navigationTest: {
          sessionExists: true,
          sessionUser: session.user?.email,
          navigationAttempted: true
        }
      }));
      
    } catch (error) {
      console.error('Navigation test failed:', error);
      setDebugInfo((prev: any) => ({
        ...prev,
        navigationTestError: error
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const testMiddlewareWithSession = async () => {
    try {
      console.log('=== TESTING MIDDLEWARE WITH SESSION ===');
      
      // Get current session from debug info
      const currentSession = debugInfo.session;
      
      // Test direct navigation to protected route
      const testUrl = '/dashboard/role-selection';
      console.log('Testing navigation to:', testUrl);
      
      // Simulate a fetch request to test middleware
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
      });
      
      console.log('Response status:', response.status);
      console.log('Response URL:', response.url);
      console.log('Redirected:', response.redirected);
      
      setDebugInfo((prev: any) => ({
        ...prev,
        middlewareTest: {
          sessionExists: !!currentSession,
          sessionUser: currentSession?.user,
          testUrl,
          responseStatus: response.status,
          responseUrl: response.url,
          redirected: response.redirected,
        }
      }));
    } catch (error) {
      console.error('Middleware test error:', error);
    }
  };

  const testAuthGuard = async () => {
    try {
      console.log('=== TESTING AUTH GUARD ===');
      
      // Simulate what AuthGuard does
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('AuthGuard session check:', session ? 'EXISTS' : 'MISSING');
      console.log('AuthGuard session user:', session?.user?.email);
      console.log('AuthGuard session error:', sessionError);
      
      // Check localStorage token
      const storedToken = localStorage.getItem('supabase.auth.token');
      console.log('AuthGuard stored token:', storedToken ? 'PRESENT' : 'MISSING');
      
      setDebugInfo((prev: any) => ({
        ...prev,
        authGuardTest: {
          sessionExists: !!session,
          sessionUser: session?.user?.email,
          storedToken: !!storedToken,
          sessionError: sessionError?.message,
        }
      }));
    } catch (error) {
      console.error('AuthGuard test error:', error);
    }
  };

  const testSupabaseClients = async () => {
    try {
      console.log('=== TESTING SUPABASE CLIENTS ===');
      
      // Test the client used by AuthGuard
      const authGuardClient = createClientComponentClient();
      const { data: { session: authGuardSession }, error: authGuardError } = await authGuardClient.auth.getSession();
      console.log('AuthGuard client session:', authGuardSession ? 'EXISTS' : 'MISSING');
      console.log('AuthGuard client user:', authGuardSession?.user?.email);
      console.log('AuthGuard client error:', authGuardError);
      
      // Test the client used by test page
      const { data: { session: testSession }, error: testError } = await supabase.auth.getSession();
      console.log('Test client session:', testSession ? 'EXISTS' : 'MISSING');
      console.log('Test client user:', testSession?.user?.email);
      console.log('Test client error:', testError);
      
      // Compare sessions
      const sessionsMatch = authGuardSession?.user?.id === testSession?.user?.id;
      console.log('Sessions match:', sessionsMatch);
      
      setDebugInfo((prev: any) => ({
        ...prev,
        supabaseClientsTest: {
          authGuardSession: !!authGuardSession,
          authGuardUser: authGuardSession?.user?.email,
          testSession: !!testSession,
          testUser: testSession?.user?.email,
          sessionsMatch,
          authGuardError: authGuardError?.message,
          testError: testError?.message,
        }
      }));
    } catch (error) {
      console.error('Supabase clients test error:', error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/main_logo.svg"
                alt="Dokani"
                width={240}
                height={64}
                className="h-16 w-auto"
              />
            </Link>
            <div className="text-sm text-gray-500">
              Authentication Testing
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Authentication Test Page</h1>
            <p className="text-gray-500 mt-2">
              Debug and test authentication functionality
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Authentication Debug Panel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Button onClick={checkAuthStatus} className="w-full">
                  Check Auth Status
                </Button>
                
                <Button onClick={testSignIn} className="w-full">
                  Test sign in
                </Button>
                
                <Button onClick={testSessionPersistence} className="w-full">
                  Test session persistance
                </Button>
                
                <Button onClick={testFullAuthFlow} className="w-full">
                  Test full auth flow
                </Button>
                
                <Button onClick={testMiddlewareWithSession} className="w-full">
                  Test middleware with session
                </Button>
                
                <Button onClick={testAuthGuard} className="w-full">
                  Test AuthGuard
                </Button>

                <Button onClick={testSupabaseClients} className="w-full">
                  Test Supabase Clients
                </Button>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Debug Information:</h3>
                <pre className="text-xs overflow-auto max-h-96">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 