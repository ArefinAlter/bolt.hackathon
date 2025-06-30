'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if we're on the chat page (which has its own unified header)
  const isChatPage = pathname === '/customer/chat';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user has selected a role
        const userRole = localStorage.getItem('userRole');
        
        if (!userRole) {
          router.push('/dashboard/role-selection');
          return;
        } else if (userRole !== 'customer') {
          router.push('/dashboard');
          return;
        }
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
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
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Only show header if not on chat page (chat page has its own unified header) */}
      {!isChatPage && (
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Logo />
                <span className="text-sm text-gray-500">Customer Portal</span>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    localStorage.setItem('userRole', 'business');
                    router.push('/dashboard');
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Switch to Business View
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}
      <main>{children}</main>
    </div>
  );
}