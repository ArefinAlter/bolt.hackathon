'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileQuestion, Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="h-10 w-10 text-orange-600 dark:text-orange-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Page Not Found</h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
        </p>
        
        <div className="space-y-4">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-black"
            onClick={() => router.push('/')}
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Homepage
          </Button>
          
          <Button
            variant="outline"
            className="w-full dark:border-gray-700 dark:text-gray-300"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-500">
          <p>Looking for something specific? Try using the search.</p>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-600" size={16} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  router.push(`/search?q=${encodeURIComponent(e.currentTarget.value)}`);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}