'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types/user';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { supabase } from '@/lib/supabase';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireProfile?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireProfile = false,
  redirectTo = '/auth/login'
}: AuthGuardProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⚠️ AUTH GUARD TIMEOUT - Force stopping loading');
      setLoading(false);
    }, 10000); // 10 second timeout

    const checkAuth = async () => {
      try {
        // First, try to get session from localStorage as backup
        const storedToken = localStorage.getItem('supabase.auth.token');
        
        // Try multiple times to get session with delays
        let session = null;
        let sessionError = null;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          const { data, error } = await supabase.auth.getSession();
          session = data.session;
          sessionError = error;
          
          if (session) {
            break;
          }
          
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Session error: ' + sessionError.message);
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }

        // If no session but we have a stored token, try to refresh
        if (!session && storedToken) {
          try {
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshedSession) {
              setUser(refreshedSession.user);
              setLoading(false);
              clearTimeout(timeoutId);
              return;
            }
          } catch (refreshError) {
            console.error('Session refresh failed:', refreshError);
          }
        }

        if (!session && requireAuth) {
          setLoading(false);
          clearTimeout(timeoutId);
          router.push(redirectTo);
          return;
        }

        if (session) {
          setUser(session.user);

          // Check profile if required
          if (requireProfile) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Profile error:', profileError);
              setError('Profile error: ' + profileError.message);
              setLoading(false);
              clearTimeout(timeoutId);
              return;
            }

            if (!profileData) {
              try {
                // Try to create profile using edge function
                const { data: createResult, error: createError } = await supabase.functions.invoke('create-profile', {
                  body: {
                    user_id: session.user.id,
                    business_name: session.user.email?.split('@')[0] || 'New Business',
                  }
                });

                if (createError) {
                  // Fallback: create profile directly
                  const { data: fallbackProfile, error: fallbackError } = await supabase
                    .from('profiles')
                    .insert({
                      id: session.user.id,
                      business_name: session.user.email?.split('@')[0] || 'New Business',
                      subscription_plan: 'free',
                      onboarded: false,
                    })
                    .select()
                    .single();

                  if (fallbackError) {
                    console.error('Fallback profile creation failed:', fallbackError);
                    setError('Failed to create profile: ' + fallbackError.message);
                    setLoading(false);
                    clearTimeout(timeoutId);
                    return;
                  }

                  setProfile(fallbackProfile);
                } else {
                  // Fetch the created profile
                  const { data: newProfile, error: fetchError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                  if (fetchError) {
                    console.error('Error fetching created profile:', fetchError);
                    setError('Profile created but could not be retrieved');
                    setLoading(false);
                    clearTimeout(timeoutId);
                    return;
                  }

                  setProfile(newProfile);
                }
              } catch (createError) {
                console.error('Profile creation failed:', createError);
                setError('Failed to create profile');
                setLoading(false);
                clearTimeout(timeoutId);
                return;
              }
            } else {
              setProfile(profileData);
            }
          }
        }

        setLoading(false);
        clearTimeout(timeoutId);
      } catch (error) {
        console.error('Auth guard error:', error);
        setError('An error occurred while checking authentication');
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    // Add a longer delay to ensure session is properly established
    const timer = setTimeout(checkAuth, 1000);
    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutId);
    };
  }, [router, requireAuth, requireProfile, redirectTo]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        if (requireAuth) {
          router.push(redirectTo);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router, requireAuth, redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => router.push(redirectTo)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}