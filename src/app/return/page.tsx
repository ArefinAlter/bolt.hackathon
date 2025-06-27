'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export default function ReturnPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has selected a role
    const userRole = localStorage.getItem('userRole');
    
    if (!userRole) {
      router.push('/dashboard/role-selection');
    } else if (userRole !== 'customer') {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    router.push('/');
  };

  const handleSwitchRole = () => {
    localStorage.setItem('userRole', 'business');
    router.push('/dashboard');
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
              <span className="ml-4 text-sm font-medium text-gray-500">Customer Return Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={handleSwitchRole}
              >
                Switch to Business View
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Return Portal</h1>
            <p className="text-gray-600">
              This is a placeholder for the customer return portal. In a complete implementation, 
              you would see a chat interface to interact with the AI agent for processing your return.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Start a New Return</h2>
            <p className="text-gray-600 mb-4">
              To initiate a return, please enter your order number below. You can use demo order numbers like ORDER-12345.
            </p>
            <div className="flex space-x-4 mb-6">
              <input
                type="text"
                placeholder="Enter order number (e.g., ORDER-12345)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button className="bg-primary hover:bg-primary/90 text-black">
                Start Return
              </Button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">Demo Instructions</h3>
              <p className="text-sm text-gray-600">
                For this demo, you can use any of the following order numbers:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                <li>ORDER-12345 - Standard return</li>
                <li>ORDER-67890 - High-value return</li>
                <li>ORDER-24680 - Return outside window</li>
              </ul>
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