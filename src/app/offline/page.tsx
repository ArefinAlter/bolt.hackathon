'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const router = useRouter();
  
  // Check if online and redirect
  useEffect(() => {
    const handleOnline = () => {
      router.push('/');
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [router]);
  
  const handleRefresh = () => {
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">You're Offline</h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          It looks like you've lost your internet connection. Some features may be unavailable until you reconnect.
        </p>
        
        <div className="space-y-4">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-black"
            onClick={handleRefresh}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
          
          <Button
            variant="outline"
            className="w-full dark:border-gray-700 dark:text-gray-300"
            onClick={() => router.push('/')}
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Homepage
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-500">
          <p>Some features may still be available offline.</p>
        </div>
      </div>
    </div>
  );
}