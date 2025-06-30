'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <CardTitle className="text-xl">Something went wrong!</CardTitle>
          <CardDescription>
            We encountered an unexpected error. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.message && (
            <div className="bg-white border border-gray-200 p-4 rounded-md mb-8 overflow-auto max-h-32">
              <pre className="text-sm text-gray-800">{error.message}</pre>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => reset()}
              className="flex-1 bg-primary hover:bg-primary/90 text-black"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Go home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}