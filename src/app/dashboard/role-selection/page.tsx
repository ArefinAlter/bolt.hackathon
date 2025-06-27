'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { RoleSelectionCard } from '@/components/auth/RoleSelectionCard';
import { UserRole } from '@/types/auth';
import { supabase } from '@/lib/supabase';

export default function RoleSelectionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Redirect to login if not authenticated
          router.push('/auth/login');
          return;
        }
        
        // Check if user already has a role selected
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) {
          if (storedRole === 'business') {
            router.push('/dashboard');
          } else {
            router.push('/return');
          }
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth/login');
      }
    };
    
    checkAuth();
  }, [router]);

  const handleRoleSelect = (role: UserRole) => {
    console.log('Selected role:', role);
    // The actual navigation is handled in the RoleSelectionCard component
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="py-6 px-4 sm:px-6 lg:px-8 border-b bg-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/main_logo.svg"
              alt="Dokani"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl">
          <RoleSelectionCard onRoleSelect={handleRoleSelect} />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 lg:px-8 border-t bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Dokani. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}