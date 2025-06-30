'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UserRole } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/common/Logo';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<UserRole>('business');
  const [userName, setUserName] = useState('User');
  const [isLoading, setIsLoading] = useState(true);

  // Memoize handlers to prevent unnecessary re-renders
  const handleRoleSwitch = useCallback(() => {
    const newRole = userRole === 'business' ? 'customer' : 'business';
    localStorage.setItem('userRole', newRole);
    setUserRole(newRole);
    
    toast({
      title: "View switched",
      description: `You are now viewing as a ${newRole === 'business' ? 'Business' : 'Customer'}`,
      duration: 3000,
    });
    
    if (newRole === 'business') {
      router.push('/dashboard');
    } else {
      router.push('/return');
    }
  }, [userRole, router, toast]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    router.push('/');
  }, [router]);
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }
        
        // Get user role from localStorage
        const storedRole = localStorage.getItem('userRole') as UserRole;
        if (storedRole) {
          setUserRole(storedRole);
        } else {
          // Only redirect to role selection if not already on that page
          const currentPath = window.location.pathname;
          if (currentPath !== '/dashboard/role-selection') {
            router.push('/dashboard/role-selection');
            return;
          }
        }
        
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_name')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserName(profile.business_name);
        } else {
          setUserName(session.user.email?.split('@')[0] || 'User');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        router.push('/auth/login');
      }
    };
    
    loadUserData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar 
        userRole={userRole || 'business'} 
        onRoleSwitch={handleRoleSwitch} 
        onSignOut={handleSignOut} 
      />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Header 
          userRole={userRole} 
          userName={userName} 
          onRoleSwitch={handleRoleSwitch} 
          onSignOut={handleSignOut} 
        />
        
        <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
        
        <footer className="py-3 px-6 border-t bg-white">
          <div className="text-center text-sm text-gray-500 max-w-7xl mx-auto">
            &copy; {new Date().getFullYear()} Dokani. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}