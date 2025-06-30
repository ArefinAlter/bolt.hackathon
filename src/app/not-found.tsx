'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileQuestion, Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/common/Logo';

export default function NotFound() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mb-6">
            <Logo className="justify-center" />
          </div>
          <CardTitle className="text-6xl font-bold text-gray-900 mb-2">404</CardTitle>
          <CardDescription className="text-lg">
            Page not found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-black">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}