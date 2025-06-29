'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CallHistory } from '@/components/dashboard/requests/CallHistory';
import { useUserStore } from '@/store/useUserStore';
import { supabase } from '@/lib/supabase';

export default function CallHistoryPage() {
  const router = useRouter();
  const { user, profile } = useUserStore();
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Check if user has a business profile
      if (!profile?.business_id) {
        router.push('/dashboard/role-selection');
        return;
      }

      // Check for demo mode
      const urlParams = new URLSearchParams(window.location.search);
      const demo = urlParams.get('demo');
      setIsDemoMode(demo === 'true');
    };

    checkAuth();
  }, [router, profile]);

  if (!user || !profile?.business_id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CallHistory 
        businessId={profile.business_id} 
        isDemoMode={isDemoMode}
      />
    </div>
  );
} 