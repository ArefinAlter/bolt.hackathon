'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UserRole } from '@/types/auth';
import { supabase } from '@/lib/supabase';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('business');
  const [userName, setUserName] = useState('User');
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
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
        
        <footer className="py-4 px-6 border-t bg-white">
          <div className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Dokani. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}