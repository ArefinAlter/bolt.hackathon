'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VideoPersonasPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the main personas page with video tab active
    router.push('/dashboard/personas?tab=video');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}