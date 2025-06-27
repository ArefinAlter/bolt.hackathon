'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has selected a role
    const userRole = localStorage.getItem('userRole');
    
    if (!userRole) {
      router.push('/dashboard/role-selection');
    } else if (userRole !== 'business') {
      router.push('/return');
    }
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    router.push('/');
  };

  const handleSwitchRole = () => {
    localStorage.setItem('userRole', 'customer');
    router.push('/return');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Image
                src="/main_logo.svg"
                alt="Dokani"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
              <span className="ml-4 text-sm font-medium text-gray-500">Business Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={handleSwitchRole}
              >
                Switch to Customer View
              </Button>
              <Button 
                variant="ghost" 
                className="text-sm text-gray-600"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to your Business Dashboard</h1>
            <p className="text-gray-600">
              This is a placeholder for the business dashboard. In a complete implementation, 
              you would see your return requests, analytics, and policy management tools here.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Return Requests</h2>
              <p className="text-gray-600 mb-4">No return requests yet.</p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-black">
                View All Requests
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Policy Management</h2>
              <p className="text-gray-600 mb-4">Configure your return policies.</p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-black">
                Manage Policies
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Analytics</h2>
              <p className="text-gray-600 mb-4">View your return analytics.</p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-black">
                View Analytics
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">
            &copy; {new Date().getFullYear()} Dokani. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}