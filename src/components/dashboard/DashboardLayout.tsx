'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UserRole } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useHotkeys } from 'react-hotkeys-hook';
import { useToast } from '@/hooks/use-toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<UserRole>('business');
  const [userName, setUserName] = useState('User');
  const [isLoading, setIsLoading] = useState(true);

  // Register keyboard shortcuts
  useHotkeys('g d', () => router.push('/dashboard'));
  useHotkeys('g r', () => router.push('/dashboard/requests'));
  useHotkeys('g p', () => router.push('/dashboard/policy'));
  useHotkeys('g a', () => router.push('/dashboard/analytics'));
  useHotkeys('g s', () => router.push('/settings'));

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
          router.push('/dashboard/role-selection');
          return;
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

  const handleRoleSwitch = () => {
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
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        userRole={userRole} 
        onRoleSwitch={handleRoleSwitch} 
        onSignOut={handleSignOut} 
      />
      
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 pt-14 lg:pt-0">
        <Header 
          userRole={userRole} 
          userName={userName} 
          onRoleSwitch={handleRoleSwitch} 
          onSignOut={handleSignOut} 
        />
        
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
        
        <footer className="py-4 px-6 border-t bg-white dark:bg-gray-900 dark:border-gray-800">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Dokani. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}