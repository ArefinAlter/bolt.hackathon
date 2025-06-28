'use client';

import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchAnalytics } from '@/lib/analytics';
import { AnalyticsResponse, MetricType, DateRange } from '@/types/analytics';

export default function AnalyticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('all');
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }
        
        // Get user profile to get business_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('business_id')
          .eq('id', session.user.id)
          .single();
        
        if (profileError || !profile) {
          console.error('Profile not found:', profileError);
          setError('Unable to load your profile. Please try logging out and back in.');
          setIsLoading(false);
          return;
        }
        
        const analyticsData = await fetchAnalytics(profile.business_id, selectedMetric, { range: dateRange });
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAnalytics();
  }, [selectedMetric, dateRange, router]);

  return <AnalyticsDashboard />;
}