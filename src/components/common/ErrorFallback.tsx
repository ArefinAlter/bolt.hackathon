'use client';

import { FallbackProps } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">
            We apologize for the inconvenience. An error has occurred in the application.
          </p>
          <div className="bg-gray-100 p-4 rounded-md w-full mb-6 overflow-auto max-h-32">
            <p className="text-sm text-gray-700 font-mono">{error.message}</p>
          </div>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
            >
              Go Home
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-black"
              onClick={resetErrorBoundary}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}