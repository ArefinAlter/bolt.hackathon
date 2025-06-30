'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Plus,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid, GridItem, Flex } from '@/components/ui/grid';
import { ReturnsTable } from '@/components/dashboard/requests/ReturnsTable';
import { ReviewQueue } from '@/components/dashboard/requests/ReviewQueue';
import { RequestDetailModal } from '@/components/dashboard/requests/RequestDetailModal';
import { ReturnRequest } from '@/types/return';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

export default function RequestsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(true)

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }
        
        let currentBusinessId: string;
        
        if (isDemoMode) {
          // Always use demo business ID in demo mode
          currentBusinessId = '550e8400-e29b-41d4-a716-446655440000';
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
          setError('Unable to load your profile. Please try logging out and back in.');
          setIsLoading(false);
          return;
        }
        
          currentBusinessId = profile.business_id;
          setBusinessId(profile.business_id);
        }
        
        // Use the correct API endpoint
        const response = await fetch(`/api/requests?demo_mode=${isDemoMode}&business_id=${currentBusinessId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch return requests');
        }
        
        const data = await response.json();
        setRequests(data.data || []);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setError('Failed to load return requests');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequests();
  }, [router, isDemoMode]); // Removed businessId from dependencies

  const handleViewRequest = (request: ReturnRequest) => {
    setSelectedRequest(request);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
  };

  const handleRequestUpdated = (updatedRequest: ReturnRequest) => {
    // Close the modal and refresh the data
    setSelectedRequest(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!businessId && !isDemoMode) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Business ID Not Found</h2>
          <p className="text-gray-600 mb-4">
            We couldn't find your business profile. Please try logging out and back in.
          </p>
          <Button 
            onClick={() => router.push('/dashboard')}
            className="bg-primary hover:bg-primary/90 text-black"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 pt-4">
      {/* Header */}
      <Grid cols={12} gap="md">
        <GridItem span={12} responsive={{ sm: 12, md: 8, lg: 8, xl: 8 }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Return Requests</h1>
          <p className="text-gray-500">
            Manage and process customer return requests
          </p>
        </div>
        </GridItem>
        <GridItem span={12} responsive={{ sm: 12, md: 4, lg: 4, xl: 4 }}>
          <Flex direction="col" gap="sm" responsive={{ 
            sm: { direction: 'col' }, 
            md: { direction: 'row', justify: 'end' },
            lg: { direction: 'row', justify: 'end' },
            xl: { direction: 'row', justify: 'end' }
          }}>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
              className="w-full md:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
              className="bg-primary hover:bg-primary/90 text-black w-full md:w-auto"
            onClick={() => router.push('/dashboard/requests/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Manual Return
          </Button>
          </Flex>
        </GridItem>
      </Grid>
      
      <Grid cols={12} gap="sm">
        <GridItem span={12} responsive={{ sm: 12, md: 6, lg: 4, xl: 3 }}>
          <Flex direction="row" gap="sm" align="center">
        <Switch checked={isDemoMode} onCheckedChange={setIsDemoMode} />
        <Badge variant={isDemoMode ? 'default' : 'secondary'}>{isDemoMode ? 'Demo' : 'Live'}</Badge>
          </Flex>
        </GridItem>
      </Grid>
      
      {error && (
        <Grid cols={12} gap="sm">
          <GridItem span={12}>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
          </GridItem>
        </Grid>
      )}
      
      {/* Review Queue */}
      <Grid cols={12} gap="lg">
        <GridItem span={12}>
      <ReviewQueue 
            businessId={businessId || '550e8400-e29b-41d4-a716-446655440000'} 
        onViewRequest={handleViewRequest}
      />
        </GridItem>
      </Grid>
      
      {/* All Returns Table */}
      <Grid cols={12} gap="lg">
        <GridItem span={12}>
      <ReturnsTable 
            businessId={businessId || '550e8400-e29b-41d4-a716-446655440000'}
        onViewRequest={handleViewRequest}
      />
        </GridItem>
      </Grid>
      
      {/* Request Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal 
          request={selectedRequest}
          onClose={handleCloseModal}
          onRequestUpdated={handleRequestUpdated}
        />
      )}
    </div>
  );
}