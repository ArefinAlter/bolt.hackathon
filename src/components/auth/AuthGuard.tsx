'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'business' | 'customer';
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Redirect to login if not authenticated
          router.push('/auth/login');
          return;
        }
        
        // If a specific role is required, check it
        if (requiredRole) {
          const storedRole = localStorage.getItem('userRole');
          
          if (!storedRole) {
            // If no role is selected, redirect to role selection
            router.push('/dashboard/role-selection');
            return;
          }
          
          if (storedRole !== requiredRole) {
            // If wrong role, redirect to appropriate dashboard
            router.push(storedRole === 'business' ? '/dashboard' : '/return');
            return;
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth/login');
      }
    };
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [router, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}