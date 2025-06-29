'use client';

import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AnalyticsResponse, MetricType, DateRange } from '@/types/analytics';
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

export default function AnalyticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('all');
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [isDemoMode, setIsDemoMode] = useState(true)

  const fetchAnalytics = async () => {
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
      
      const response = await fetch(`/api/get-analytics?business_id=${profile.business_id}&metric_type=${selectedMetric}&demo_mode=${isDemoMode}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      setAnalytics(data.data || null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMetric, dateRange, isDemoMode, router]);

  return (
    <div>
      <div className="flex items-center space-x-4 mb-4">
        <Switch checked={isDemoMode} onCheckedChange={setIsDemoMode} />
        <Badge variant={isDemoMode ? 'default' : 'secondary'}>{isDemoMode ? 'Demo' : 'Live'}</Badge>
      </div>
      <AnalyticsDashboard 
        analytics={analytics}
        isLoading={isLoading}
        error={error}
        selectedMetric={selectedMetric}
        dateRange={dateRange}
        onMetricChange={setSelectedMetric}
        onDateRangeChange={setDateRange}
        onRefresh={fetchAnalytics}
      />
    </div>
  );
}