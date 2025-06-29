'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RiskStatsCard } from '@/components/dashboard/risk-assessment/RiskStatsCard';
import { RiskProfileTable } from '@/components/dashboard/risk-assessment/RiskProfileTable';
import { RiskProfileDetail } from '@/components/dashboard/risk-assessment/RiskProfileDetail';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

interface RiskProfile {
  id: string;
  customer_email: string;
  business_id: string;
  risk_score: number;
  return_frequency: number;
  fraud_indicators: any;
  behavior_patterns: any;
  last_updated: string;
  created_at: string;
}

export default function RiskAssessmentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [riskProfiles, setRiskProfiles] = useState<RiskProfile[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<RiskProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string>('');
  const [isDemoMode, setIsDemoMode] = useState(true)
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRiskData = async () => {
      try {
        // Check if user has selected a role
        const userRole = localStorage.getItem('userRole');
        
        if (!userRole) {
          router.push('/dashboard/role-selection');
          return;
        } else if (userRole !== 'business') {
          router.push('/return');
          return;
        }
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }
        
        // Get user profile to get business_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_id')
          .eq('id', session.user.id)
          .single();
        
        if (!profile) {
          console.error('Profile not found');
          setIsLoading(false);
          return;
        }
        
        setBusinessId(profile.business_id);
        
        // Fetch risk profiles from database (since we don't have a list endpoint)
        const { data: profiles } = await supabase
          .from('customer_risk_profiles')
          .select('*')
          .eq('business_id', profile.business_id)
          .order('risk_score', { ascending: false });
        
        if (profiles) {
          setRiskProfiles(profiles);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading risk data:', error);
        setIsLoading(false);
      }
    };
    
    loadRiskData();
  }, [router]);

  const handleViewProfile = (profile: RiskProfile) => {
    setSelectedProfile(profile);
    setSelectedCustomerEmail(profile.customer_email);
    setIsDetailOpen(true);
  };

  const handleRecalculateRisk = async (customerEmail: string) => {
    if (!businessId) return;

    try {
      const response = await fetch('/api/risk-assessment/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_email: customerEmail,
          business_id: businessId,
          order_value: 0, // Default value
          reason_for_return: '' // Default value
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to recalculate risk');
      }

      const result = await response.json();
      
      // Update the profile in the local state
      setRiskProfiles(prev => 
        prev.map(profile => 
          profile.customer_email === customerEmail 
            ? { 
                ...profile, 
                risk_score: result.data.risk_score,
                last_updated: new Date().toISOString()
              }
            : profile
        )
      );

      // If detail modal is open, refresh it
      if (isDetailOpen && selectedCustomerEmail === customerEmail) {
        // The detail component will handle refreshing its own data
      }

    } catch (error) {
      console.error('Error recalculating risk:', error);
      // You might want to show a toast notification here
    }
  };

  const getRiskStats = () => {
    const total = riskProfiles.length;
    const high = riskProfiles.filter(p => p.risk_score >= 0.7).length;
    const medium = riskProfiles.filter(p => p.risk_score >= 0.3 && p.risk_score < 0.7).length;
    const low = riskProfiles.filter(p => p.risk_score < 0.3).length;
    const avgScore = total > 0 ? riskProfiles.reduce((sum, p) => sum + p.risk_score, 0) / total : 0;
    
    return { total, high, medium, low, avgScore };
  };

  const fetchRisk = async () => {
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
        return;
      }
      
      const response = await fetch(`/api/risk-assessment/profile?business_id=${profile.business_id}&demo_mode=${isDemoMode}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch risk profiles');
      }
      
      const data = await response.json();
      if (data.data) {
        setRiskProfiles(data.data);
      }
    } catch (error) {
      console.error('Error fetching risk profiles:', error);
      setError('Failed to load risk profiles');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = getRiskStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <Switch checked={isDemoMode} onCheckedChange={setIsDemoMode} />
        <Badge variant={isDemoMode ? 'default' : 'secondary'}>{isDemoMode ? 'Demo' : 'Live'}</Badge>
      </div>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Risk Assessment</h1>
          <p className="text-black">Monitor customer risk profiles and fraud indicators</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <RiskStatsCard stats={stats} />

      {/* Risk Profiles Table */}
      <RiskProfileTable 
        riskProfiles={riskProfiles}
        onViewProfile={handleViewProfile}
        onRecalculateRisk={handleRecalculateRisk}
      />

      {/* Risk Profile Detail Modal */}
      {businessId && (
        <RiskProfileDetail
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedCustomerEmail('');
            setSelectedProfile(null);
          }}
          customerEmail={selectedCustomerEmail}
          businessId={businessId}
          onRecalculate={handleRecalculateRisk}
        />
      )}
    </div>
  );
} 