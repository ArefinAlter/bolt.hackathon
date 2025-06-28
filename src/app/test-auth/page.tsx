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

  const testNavigation = () => {
    router.push('/dashboard/role-selection');
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
              <Button onClick={testNavigation} variant="outline">
                Test Navigation
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