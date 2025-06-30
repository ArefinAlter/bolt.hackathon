'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Grid, GridItem, Flex, Container } from '@/components/ui/grid';
import { CallHistory } from '@/components/dashboard/requests/CallHistory';
import { useUserStore } from '@/store/useUserStore';
import { supabase } from '@/lib/supabase';

export default function CallHistoryPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  const { user, profile } = useUserStore();
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  console.log('CallHistoryPage render', { user, profile, isDemoMode, businessId });

  // Update ref when router changes
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    console.log('CallHistoryPage useEffect triggered');
    const checkAuth = async () => {
      console.log('checkAuth started');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session check result:', { session: !!session });
      
      if (!session) {
        console.log('No session, redirecting to login');
        routerRef.current.push('/auth/login');
        return;
      }

      // Check for demo mode
      const urlParams = new URLSearchParams(window.location.search);
      const demo = urlParams.get('demo');
      const demoMode = demo === 'true' || true; // Default to demo mode
      console.log('Demo mode check:', { demo, demoMode });
      setIsDemoMode(demoMode);

      if (demoMode) {
        // Always use demo business ID in demo mode
        console.log('Setting demo business ID');
        setBusinessId('550e8400-e29b-41d4-a716-446655440000');
      } else {
        // Get user profile to get business_id for live mode
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('business_id')
          .eq('id', session.user.id)
          .single();
        
        if (profileError || !profile) {
          console.error('Profile not found:', profileError);
          // Only redirect to role selection if not in demo mode
          routerRef.current.push('/dashboard/role-selection');
          return;
        }
        
        setBusinessId(profile.business_id);
      }
    };

    checkAuth();
  }, []); // Empty dependency array since we use refs

  console.log('CallHistoryPage before conditional render', { 
    user: !!user, 
    businessId: !!businessId, 
    isDemoMode, 
    shouldShowLoading: !user || (!businessId && !isDemoMode) 
  });

  // In demo mode, we don't need a user from useUserStore
  if (!isDemoMode && !user) {
    console.log('No user in live mode, showing loading spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // In demo mode, we need businessId to be set
  if (isDemoMode && !businessId) {
    console.log('Demo mode but no businessId, showing loading spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log('CallHistoryPage', { businessId, isDemoMode, user });

  return (
    <div>
      <Grid cols={12} gap="lg">
        <GridItem span={12}>
          <CallHistory 
            businessId={businessId || '550e8400-e29b-41d4-a716-446655440000'} 
            isDemoMode={isDemoMode}
          />
        </GridItem>
      </Grid>
    </div>
  );
} 