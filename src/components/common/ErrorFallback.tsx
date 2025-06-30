'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/common/Logo';

export function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-6">
            <Logo className="justify-center" />
          </div>
          <div className="w-16 h-16 bg-red-50 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. We apologize for the inconvenience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white border border-gray-200 p-4 rounded-md w-full mb-6 overflow-auto max-h-32">
            <pre className="text-sm text-gray-800">{error.message}</pre>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={resetErrorBoundary}
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