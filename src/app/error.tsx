'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We apologize for the inconvenience. An error has occurred in the application.
        </p>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-8 overflow-auto max-h-32">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono text-left">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        
        <div className="space-y-4">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-black"
            onClick={reset}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
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
      </div>
    </div>
  );
}