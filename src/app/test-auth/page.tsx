'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@supabase/supabase-js';

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
    setIsLoading(true);
    try {
      console.log('=== FULL AUTH FLOW TEST START ===');
      
      // First check if we already have a session
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      
      if (existingSession) {
        console.log('Session already exists, testing navigation directly...');
        setDebugInfo((prev: any) => ({
          ...prev,
          fullAuthFlow: {
            existingSession: true,
            sessionUser: existingSession.user?.email,
            testingNavigation: true
          }
        }));
        
        // Test navigation with existing session
        setTimeout(() => {
          console.log('Navigating to role selection with existing session...');
          window.location.replace('/dashboard/role-selection');
        }, 1000);
        
        return;
      }
      
      // Step 1: Sign in (using your actual credentials)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'arefin.rajulaw@gmail.com',
        password: 'your_actual_password' // You'll need to replace this
      });
      
      if (error) {
        console.error('Sign in failed:', error);
        setDebugInfo((prev: any) => ({
          ...prev,
          fullAuthFlowError: error
        }));
        return;
      }
      
      console.log('Sign in successful:', data);
      
      // Step 2: Wait for session establishment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session check:', session);
      console.log('Session error:', sessionError);
      
      // Step 4: Set localStorage backup
      if (session?.access_token) {
        localStorage.setItem('supabase.auth.token', session.access_token);
        console.log('Token stored in localStorage');
      }
      
      // Step 5: Test navigation
      console.log('Testing navigation to role selection...');
      window.location.replace('/dashboard/role-selection');
      
      setDebugInfo((prev: any) => ({
        ...prev,
        fullAuthFlow: {
          signInSuccess: true,
          sessionExists: !!session,
          sessionUser: session?.user?.email,
          localStorageSet: !!session?.access_token,
          navigationAttempted: true
        }
      }));
      
      console.log('=== FULL AUTH FLOW TEST END ===');
      
    } catch (error) {
      console.error('Full auth flow test failed:', error);
      setDebugInfo((prev: any) => ({
        ...prev,
        fullAuthFlowError: error
      }));
    } finally {
      setIsLoading(false);
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
    setIsLoading(true);
    try {
      console.log('=== TESTING MIDDLEWARE WITH SESSION ===');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found');
        setDebugInfo((prev: any) => ({
          ...prev,
          middlewareTest: {
            sessionExists: false,
            error: 'No session found'
          }
        }));
        return;
      }
      
      console.log('Session found:', session.user?.email);
      
      // Test if we can access a protected route
      const testUrl = '/dashboard/role-selection';
      console.log('Testing access to:', testUrl);
      
      // Simulate a fetch request to see if middleware blocks it
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response URL:', response.url);
      
      setDebugInfo((prev: any) => ({
        ...prev,
        middlewareTest: {
          sessionExists: true,
          sessionUser: session.user?.email,
          testUrl: testUrl,
          responseStatus: response.status,
          responseUrl: response.url,
          redirected: response.url !== window.location.origin + testUrl
        }
      }));
      
    } catch (error) {
      console.error('Middleware test failed:', error);
      setDebugInfo((prev: any) => ({
        ...prev,
        middlewareTestError: error
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <Button onClick={checkAuthStatus} disabled={isLoading}>
                {isLoading ? 'Checking...' : 'Check Auth Status'}
              </Button>
              <Button onClick={testSignIn} variant="outline">
                Test Sign In
              </Button>
              <Button onClick={testSessionPersistence} variant="outline">
                Test Session Persistence
              </Button>
              <Button onClick={testNavigation} variant="outline">
                Test Navigation
              </Button>
              <Button onClick={testFullAuthFlow} variant="outline">
                Test Full Auth Flow
              </Button>
              <Button onClick={testNavigationWithExistingSession} variant="outline">
                Test Navigation with Existing Session
              </Button>
              <Button onClick={testMiddlewareWithSession} variant="outline">
                Test Middleware with Session
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
    </div>
  );
} 