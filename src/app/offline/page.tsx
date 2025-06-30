'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    window.location.reload();
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mb-6">
            <Logo className="justify-center" />
          </div>
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-gray-500" />
          </div>
          <CardTitle className="text-xl">You're offline</CardTitle>
          <CardDescription>
            Please check your internet connection and try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full bg-primary hover:bg-primary/90 text-black"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}